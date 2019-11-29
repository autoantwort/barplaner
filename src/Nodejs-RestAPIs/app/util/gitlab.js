const db = require('../config/db.config.js');
const env = require('../config/env');
const Telegram = require('./telegram.js');
const CronJob = require('cron').CronJob;
const Axios = require("axios");
const fs = require("fs");
const path = require('path');

const User = db.User;
const Op = db.Sequelize.Op;

let axios = Axios.create({
    baseURL: "https://git.rwth-aachen.de/api/v4",
    headers: {
        "Private-Token": env.gitLabAccessToken,
    }
});

const issueCronJob = new CronJob('00 00 12 1,15 * *', function() {
    exports.sendNotificationsForIssus().then(() => console.log("Git Nachrichten erfolgreich versendet.")).catch(e => console.error("Fehler beim Senden der Issues: ", e));
}, null, true);

exports.getUser = (userObject) => {
    return new Promise((resolve, reject) => {
        if (userObject.id === undefined || userObject.username === undefined || userObject.name === undefined) {
            reject("The given user object " + JSON.stringify(userObject) + " is not a user object. It must have the parameters id, username, name.");
        }
        User.findOne({
            where: {
                gitLabID: userObject.id
            },
        }).then(user => {
            if (user !== null) {
                resolve(user);
                return;
            }
            User.findAll({
                where: {
                    email:  {
                        [Op.like]: '%' + userObject.username + '%'
                    }
                }
            }).then(users => {
                if (users.length === 1) {
                    resolve(users[0]);
                } else if (users.length === 0) {
                    const subNameContains = userObject.name.split(' ').concat(userObject.username.split('.')).map(s => ({
                        name: {
                            [Op.like]: '%' + s + '%'
                        }
                    }));
                    User.findAll({
                        where: {
                            [Op.and]: [{
                                active: true
                            }, {
                                [Op.or]: subNameContains
                            }]
                        }
                    }).then(users => {
                        if (users.length === 1) {
                            resolve(users[0]);
                        } else {
                            resolve(null);
                        }
                    }).catch(reject);
                }
            }).catch(reject);
        }).catch(reject);
    });
};

let screenShotFileID = null;

exports.sendNotificationsForIssus = () => {
    return new Promise((resolve, reject) => {
        // first we need a list of all projects to show a project name for an project id
        axios.get("/projects?membership=true&per_page=100").then(response => {
            const projects = {};
            response.data.forEach(project => projects[project.id] = project);
            const issues = [];
            // promises for when we have all issues            
            const promises = [];
            response.data.forEach(project => {
                // get issues for a project
                promises.push(new Promise((resolve, reject) => {
                    axios.get("/projects/" + project.id + "/issues?scope=all&state=opened&per_page=100").then(response => {
                        projectIssues = response.data;
                        if (projectIssues.length === 100) {
                            console.warn("Not all issus were returned for project " + project.name);
                        }
                        const promises = [];
                        projectIssues.forEach(issue => {
                            const promise = new Promise((resolve, reject) => {
                                // get participants of an issue
                                axios.get("/projects/" + issue.project_id + "/issues/" + issue.iid + "/participants").then(response => {
                                    issue.participants = response.data;
                                    resolve();
                                }).catch(reject);
                            });
                            promises.push(promise);
                        });
                        projectIssues.forEach(i => issues.push(i));
                        Promise.all(promises).then(() => {
                            resolve();
                        }).catch(reject);
                    }).catch(reject);
                }));
            });

            Promise.all(promises).then(() => {

                // we now have all participants for every issue of every project
                const userMessages = {};
                const participants = {};
                const lastUserProject = {};
                issues.forEach(issue => {
                    const project = projects[issue.project_id];
                    issue.participants.forEach(participant => {
                        // welcome message if the user has no issue until now
                        let userMessage = userMessages[participant.id];
                        if (userMessage === undefined) {
                            userMessage = "Eine Übersicht aller Issues im Git mit welchen du etwas zu tun hast: \n";
                            lastUserProject[participant.id] = issue.id;
                            participants[participant.id] = participant;
                            participants[participant.id].hasAssignment = false;
                        }
                        // check if the user needs a project headline 
                        if (lastUserProject[participant.id] !== issue.project_id) {
                            lastUserProject[participant.id] = issue.project_id;
                            userMessage += "\n*Projekt* [" + project.name + "](" + project.web_url + ") \n";
                        }
                        const isAssigned = issue.assignees.map(u => u.id).includes(participant.id);
                        userMessage += (isAssigned ? "👉" : "`      `") + "[#" + issue.iid + "](" + issue.web_url + ") " + issue.title + " ";
                        participants[participant.id].hasAssignment |= isAssigned;
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
                    });
                });
                const promises = [];
                for (let participantID in participants) {
                    console.log(participantID, " : ", participants[participantID]);
                    const promise = new Promise((resolve, reject) => {
                        this.getUser(participants[participantID]).then(user => {
                            if (user !== null) {
                                if (user.gitLabID === null) {
                                    user.gitLabID = participantID;
                                    user.save();
                                }
                                const userMessage = userMessages[participantID] + (participants[participantID].hasAssignment ? "\nBei Issus die mit 👉 markiert wurden wurdest du zugeordnet." : "");
                                Telegram.sendMessage(user, userMessage);
                            }
                            resolve();
                        }).catch(reject);
                    });
                    promises.push(promise);
                }
                // wenn alle Benutzer bestimmt und nachrichten versendet:
                Promise.all(promises).then(() =>  {
                    User.findAll({
                        where: {
                            active: true,
                            gitLabID: null,
                        }
                    }).then(users => {
                        users.forEach(user => {
                            const file = screenShotFileID === null ? fs.createReadStream(path.join(__dirname, "..", "images", "screenshot_user_settings.png")) : screenShotFileID;
                            Telegram.bot.sendPhoto(user.telegramID, file, { caption: "Deinem Barplaner Account konnte kein GitLab Account automatisch zugeordnet werden. Du musst diese Zuordnung leider selber durchführen. Gehe dafür bitte auf git.rwth-aachen.de/profile, kopiere die User ID, trage sie unter orga.symposion.hilton.rwth-aachen.de/#/account ein und klicke auf 'Update information'." }).then(response => console.log(response.body)).catch(console.error); // Besuche dafür die Seite: orga.symposion.hilton.rwth-aachen.de/#/account");
                        });
                        resolve();
                    }).catch(reject);
                }).catch(reject);
            }).catch(reject);
        }).catch(reject);
    });
};