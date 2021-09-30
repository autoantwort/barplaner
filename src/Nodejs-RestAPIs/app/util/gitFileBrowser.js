import db from '../config/db.config';
import { Op } from 'sequelize';

const env = require('../config/env');
const Telegram = require('./telegram.js');
const Axios = require("axios");

const axios = Axios.default.create({
    baseURL: "https://" + env.gitLabBrowser.host + "/api/v4",
    headers: {
        "Private-Token": env.gitLabAccessToken,
    }
});

const State = {
    CLOSE: -1,
    DIR: 0,
    FILE: 1,
    PDF: 2,
    ORIGINAL: 3,
};

const dataMapping = {
    // the root has id 0
    "0": {
        path: "",
        parent: "-1",
    },
};
let currentId = Date.now();
const addDataMapping = (data) => {
    ++currentId;
    dataMapping[currentId] = data;
    return currentId;
};
const getDataMapping = (id) => {
    return dataMapping[id];
};

let convertFileEnding = new RegExp("\\.(" + env.gitLabBrowser.convertedToPdf.join("|") + ")$");


Telegram.bot.onText(/\/(files?|datei(en)?|pdfs?|git|gitlab)/, msg => {
    const fakeUser = {
        telegramID: "" + msg.chat.id,
        id: '',
    };
    const message = fileBrowserMessageCreator.createMessage(fakeUser, "Wähle eine Datei oder ein Verzeichnis aus. Nutze `..` um ein Verzeichnis aufzusteigen.");
    // see https://docs.gitlab.com/ee/api/repositories.html#list-repository-tree
    axios.get("/projects/" + env.gitLabBrowser.projectId + "/repository/tree").then(res => {
        message.addButtonToRow("Schließen", State.CLOSE, "-1");
        message.newRow();
        for (let entry of res.data) {
            message.addButtonToRow((entry.type === 'tree' ? "↳ " : "⤓ ") + entry.path, entry.type === 'tree' ? State.DIR : State.FILE, addDataMapping({ path: entry.path, parent: 0, sha: entry.id }));
            message.newRow();
        }
        message.sendMessage().catch(console.error);
    }).catch(console.error);
});

// handle responses to the bar
const fileBrowserMessageCreator = Telegram.registerResponseSystem("gitBrowser", (message) => {
    if (message.state === State.CLOSE) {
        Telegram.deleteTelegramMessage(message.chatId, message.messageId, new Date());
        return;
    }
    const data = getDataMapping(message.data);
    if (data === undefined) {
        message.newText = "Server neu gestartet, führe /dateien neu aus.";
        message.sendUpdatedMessage();
        return;
    }
    const fileOptions = {
        // Explicitly specify the file name.
        filename: data.path.substring(data.path.lastIndexOf('/') + 1),
        contentType: "application/octet-stream",
    };
    if (message.state === State.DIR) {
        // see https://docs.gitlab.com/ee/api/repositories.html#list-repository-tree
        axios.get("/projects/" + env.gitLabBrowser.projectId + "/repository/tree", { params: { path: data.path } }).then(res => {
            message.addButtonToRow("Schließen", State.CLOSE, "-1");
            message.newRow();
            if (data.parent !== "-1") {
                message.addButtonToRow("..", State.DIR, data.parent);
                message.newRow();
            }
            for (let entry of res.data) {
                message.addButtonToRow((entry.type === 'tree' ? "↳ " : "⤓ ") + entry.path.substring(entry.path.lastIndexOf('/') + 1), entry.type === 'tree' ? State.DIR : State.FILE, addDataMapping({ path: entry.path, parent: message.data, sha: entry.id }));
                message.newRow();
            }
            message.sendUpdatedMessage().catch(console.error);
        }).catch(console.error);
    } else if (message.state === State.FILE || message.state === State.ORIGINAL) {
        if (message.state !== State.ORIGINAL && convertFileEnding.test(data.path)) {
            // If a pdf is available, ask if the user want the pdf
            message.addButtonToRow("Abbrechen", State.CLOSE, "-1");
            message.newRow();
            message.addButtonToRow("Download as " + data.path.substring(data.path.lastIndexOf('.') + 1), State.ORIGINAL, message.data);
            message.addButtonToRow("Download as Pdf", State.PDF, message.data);
            message.sendUpdatedMessage();
        } else {
            // send as original
            // https://docs.gitlab.com/ee/api/repositories.html#raw-blob-content
            axios.get("/projects/" + env.gitLabBrowser.projectId + "/repository/blobs/" + data.sha + "/raw", { responseType: 'stream' }).then(res => {
                Telegram.bot.sendDocument(message.chatId, res.data, {}, fileOptions).catch(console.error);
                Telegram.deleteTelegramMessage(message.chatId, message.messageId, new Date());
            }).catch(console.error);
        }
    } else if (message.state === State.PDF) {
        // https://docs.gitlab.com/ee/api/jobs.html#download-a-single-artifact-file-from-specific-tag-or-branch
        const path = (data.path.endsWith(".md") ? data.path : data.path.substring(0, data.path.lastIndexOf("."))) + ".pdf";
        fileOptions.filename = path.substring(data.path.lastIndexOf('/') + 1);
        axios.get("/projects/" + env.gitLabBrowser.projectId + "/jobs/artifacts/master/raw/" + encodeURIComponent(path) + "?job=" + env.gitLabBrowser.jobName, { responseType: 'stream' }).then(res => {
            Telegram.bot.sendDocument(message.chatId, res.data, {}, fileOptions).catch(console.error);
            Telegram.deleteTelegramMessage(message.chatId, message.messageId, new Date());
        }).catch(console.error);
    } else {
        console.error("Unexpected state : ", message);
    }
});