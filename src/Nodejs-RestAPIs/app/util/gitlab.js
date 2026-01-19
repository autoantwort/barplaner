import env from '../config/env';
import axiosLib from 'axios';
import { sendMessage, bot } from './telegram.js';
import { CronJob } from 'cron';
import { createReadStream } from "fs";
import { join } from 'path';
import { User } from '../model/user.model.js';
import { Op } from 'sequelize';

let axios = axiosLib.create({
    baseURL: "https://git.rwth-aachen.de/api/v4",
    headers: {
        "Private-Token": env.gitLabAccessToken,
    }
});

const issueCronJob = new CronJob('00 00 12 1,15 * *', function () {
    sendNotificationsForIssus().then(() => console.log("Git Nachrichten erfolgreich versendet.")).catch(e => console.error("Fehler beim Senden der Issues: ", e));
}, null, true);

export async function getUser(userObject) {
    if (userObject.id === undefined || userObject.username === undefined || userObject.name === undefined) {
        throw new Error(`The given user object ${JSON.stringify(userObject)} is not a user object. It must have the parameters id, username, name.`);
    }

    // Try to find the user by gitLabID
    let user = await User.findOne({
        where: {
            gitLabID: userObject.id
        },
    });

    if (user !== null) {
        return user;
    }

    // Try to find users by email pattern
    const users = await User.findAll({
        where: {
            email: {
                [Op.like]: '%' + userObject.username + '%'
            }
        }
    });

    if (users.length === 1) {
        return users[0];
    }

    // Create a list of conditions based on the name and username
    const subNameContains = userObject.name.split(' ')
        .concat(userObject.username.split('.'))
        .map(s => ({
            name: {
                [Op.like]: '%' + s + '%'
            }
        }));

    // Find users where active is true and name contains parts of subNameContains
    const filteredUsers = await User.findAll({
        where: {
            [Op.and]: [
                { active: true },
                { [Op.or]: subNameContains }
            ]
        }
    });

    if (filteredUsers.length === 1) {
        return filteredUsers[0];
    } else {
        return null;
    }
}

function inviteViaEmail(email) {
    return axios.post(`/groups/${env.gitLabSymposionGroupId}/invitations`, {
        email: email,
        access_level: 30,
        invite_source: "Barplaner",
    });
}


let screenShotFileID = null;

export async function sendNotificationsForIssus() {
    const projectsResponse = await axios.get("/projects?membership=true&per_page=100");
    const projects = {};
    const issues = [];

    const userMessages = {};
    const messageParticipants = {};
    const lastUserProject = {};

    for (const project of projectsResponse.data) {
        projects[project.id] = project;
    }

    for (const [projectId, project] of Object.entries(projects)) {
        const issuesResponse = await axios.get(`/projects/${projectId}/issues?scope=all&state=opened&per_page=100`);

        if (issuesResponse.data >= 100) {
            console.warn(`Not all issues were returned for project ${project.name}`);
        }

        const participantPromises = [];
        for (const issue of issuesResponse.data) {
            participantPromises.push(axios.get(`/projects/${issue.project_id}/issues/${issue.iid}/participants`))
        }

        const participants = await Promise.all(participantPromises);

        for (const [index, issue] of issuesResponse.data.entries()) {
            issue.participants = participants[index].data;
            issues.push(issue);
        }
    }

    for (const issue of issues) {
        const project = projects[issue.project_id];

        for (const participant of issue.participants) {
            const user = await getUser(participant);

            if (user !== null) {
                let userMessage = userMessages[participant.id];
                const isAssigned = issue.assignees.map(u => u.id).includes(participant.id);

                if ((user.only_show_gitlab_notifications_if_assigned && isAssigned) || !user.only_show_gitlab_notifications_if_assigned) {
                    if (userMessage === undefined) {
                        userMessage = "Eine Übersicht aller Issues im Git mit welchen du etwas zu tun hast: \n";
                        lastUserProject[participant.id] = issue.id;
                        messageParticipants[participant.id] = participant;
                        messageParticipants[participant.id].hasAssignment = false;
                    }

                    // check if the user needs a project headline 
                    if (lastUserProject[participant.id] !== issue.project_id) {
                        lastUserProject[participant.id] = issue.project_id;
                        userMessage += "\n*Projekt* [" + project.name + "](" + project.web_url + ") \n";
                    }


                    userMessage += (isAssigned ? "👉" : "`      `") + "[#" + issue.iid + "](" + issue.web_url + ") " + issue.title + " ";
                    messageParticipants[participant.id].hasAssignment |= isAssigned;

                    if (issue.upvotes > 0) {
                        userMessage += "👍" + issue.upvotes + " ";
                    }

                    if (issue.downvotes > 0) {
                        userMessage += "👎" + issue.downvotes + " ";
                    }

                    if (issue.due_date !== null) {
                        userMessage += " Fälligkeitsdatum: " + issue.due_date + " ";
                    }

                    userMessage += "\n";
                    userMessages[participant.id] = userMessage;
                }


            }
        }
    }

    for (const [participantId, message] of Object.entries(userMessages)) {
        const user = await getUser(messageParticipants[participantId]);

        if (user.gitLabID === null) {
            user.gitLabID = participantId;
            user.save();
        }

        let finalMessage;

        if (message !== undefined) {
            finalMessage = message + (messageParticipants[participantId].hasAssignment ? "\nBei Issues die mit 👉 markiert wurden wurdest du zugeordnet." : "");
        }

        try {
            if (finalMessage !== undefined) {
                sendMessage(user, finalMessage);
            }
        } catch (e) {
            console.warn("Couldn't send telegram message.");
        }
    }

    const users = await User.findAll({
        where: {
            active: true,
            gitLabID: null,
        }
    });

    for (const user of users) {
        const file = screenShotFileID === null ? createReadStream(join(__dirname, "..", "images", "screenshot_user_settings.png")) : screenShotFileID;
        try {
            bot.sendPhoto(user.telegramID, file, { caption: "Deinem Barplaner Account konnte kein GitLab Account automatisch zugeordnet werden. Du musst diese Zuordnung leider selber durchführen. Gehe dafür bitte auf git.rwth-aachen.de/-/user_settings/profile#user_name, kopiere die User ID, trage sie unter orga.symposion.hilton.rwth-aachen.de/#/account ein und klicke auf 'Update information'." }).then(response => console.log(response.body)).catch(console.error); // Besuche dafür die Seite: orga.symposion.hilton.rwth-aachen.de/#/account");
            inviteViaEmail(user.email);
        } catch (e) {
            console.warn("Couldn't send telegram message.");
        }
    }
}