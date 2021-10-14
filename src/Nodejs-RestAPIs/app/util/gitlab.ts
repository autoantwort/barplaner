import db from "../config/db.config";
import { Op } from "sequelize";

const env = require("../config/env");
const Telegram = require("./telegram.js");
const CronJob = require("cron").CronJob;
const Axios = require("axios");
const fs = require("fs");
const path = require("path");

const User = db.User;

let axios = Axios.default.create({
  baseURL: "https://git.rwth-aachen.de/api/v4",
  headers: {
    "Private-Token": env.gitLabAccessToken,
  },
});

const issueCronJob = new CronJob(
  "00 00 12 1,15 * *",
  function () {
    exports
      .sendNotificationsForIssus()
      .then(() => console.log("Git Nachrichten erfolgreich versendet."))
      .catch((e) => console.error("Fehler beim Senden der Issues: ", e));
  },
  null,
  true
);

export const getUser = (userObject) => {
  return new Promise((resolve, reject) => {
    if (
      userObject.id === undefined ||
      userObject.username === undefined ||
      userObject.name === undefined
    ) {
      reject(
        "The given user object " +
          JSON.stringify(userObject) +
          " is not a user object. It must have the parameters id, username, name."
      );
    }
    User.findOne({
      where: {
        gitLabID: userObject.id,
      },
    })
      .then((user) => {
        if (user !== null) {
          resolve(user);
          return;
        }
        User.findAll({
          where: {
            email: {
              [Op.like]: "%" + userObject.username + "%",
            },
          },
        })
          .then((users) => {
            if (users.length === 1) {
              resolve(users[0]);
            } else if (users.length === 0) {
              const subNameContains = userObject.name
                .split(" ")
                .concat(userObject.username.split("."))
                .map((s) => ({
                  name: {
                    [Op.like]: "%" + s + "%",
                  },
                }));
              User.findAll({
                where: {
                  [Op.and]: [
                    {
                      active: true,
                    },
                    {
                      [Op.or]: subNameContains,
                    },
                  ],
                },
              })
                .then((users) => {
                  if (users.length === 1) {
                    resolve(users[0]);
                  } else {
                    resolve(null);
                  }
                })
                .catch(reject);
            }
          })
          .catch(reject);
      })
      .catch(reject);
  });
};

let screenShotFileID = null;

export const sendNotificationsForIssus = async () => {
  const projectsResponse = await axios.get(
    "/projects?membership=true&per_page=100"
  );
  const projects = {};
  const issues = [];

  const userMessages = {};
  const messageParticipants = {};
  const lastUserProject = {};

  for (const project of projectsResponse.data) {
    projects[project.id] = project;
  }

  for (const [projectId, project]  of Object.entries<any>(projects)) {
    const issuesResponse = await axios.get(
      `/projects/${projectId}/issues?scope=all&state=opened&per_page=100`
    );

    if (issuesResponse.data >= 100) {
      console.warn(`Not all issus were returned for project ${project.name}`);
    }

    const participantPromises = [];
    for (const issue of issuesResponse.data) {
      participantPromises.push(
        axios.get(
          `/projects/${issue.project_id}/issues/${issue.iid}/participants`
        )
      );
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
      const user: any = await getUser(participant);

      if (user !== null) {
        let userMessage = userMessages[participant.id];
        const isAssigned = issue.assignees
          .map((u) => u.id)
          .includes(participant.id);

        if (
          (user.only_show_gitlab_notifications_if_assigned && isAssigned) ||
          !user.only_show_gitlab_notifications_if_assigned
        ) {
          if (userMessage === undefined) {
            userMessage =
              "Eine Übersicht aller Issues im Git mit welchen du etwas zu tun hast: \n";
            lastUserProject[participant.id] = issue.id;
            messageParticipants[participant.id] = participant;
            messageParticipants[participant.id].hasAssignment = false;
          }

          // check if the user needs a project headline
          if (lastUserProject[participant.id] !== issue.project_id) {
            lastUserProject[participant.id] = issue.project_id;
            userMessage +=
              "\n*Projekt* [" + project.name + "](" + project.web_url + ") \n";
          }

          userMessage +=
            (isAssigned ? "👉" : "`      `") +
            "[#" +
            issue.iid +
            "](" +
            issue.web_url +
            ") " +
            issue.title +
            " ";
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

  for (const [participantId, message] of Object.entries<any>(userMessages)) {
    const user: any = await getUser(messageParticipants[participantId]);

    if (user.gitLabID === null) {
      user.gitLabID = participantId;
      user.save();
    }

    let finalMessage;

    if (message !== undefined) {
      finalMessage =
        message +
        (messageParticipants[participantId].hasAssignment
          ? "\nBei Issues die mit 👉 markiert wurden wurdest du zugeordnet."
          : "");
    }

    try {
      if (finalMessage !== undefined) {
        Telegram.sendMessage(user, finalMessage);
      }
    } catch (e) {
      console.warn("Couldn't send telegram message.");
    }
  }

  const users = await User.findAll({
    where: {
      active: true,
      gitLabID: null,
    },
  });

  for (const user of users) {
    const file =
      screenShotFileID === null
        ? fs.createReadStream(
            path.join(__dirname, "..", "images", "screenshot_user_settings.png")
          )
        : screenShotFileID;
    try {
      Telegram.bot
        .sendPhoto(user.telegramID, file, {
          caption:
            "Deinem Barplaner Account konnte kein GitLab Account automatisch zugeordnet werden. Du musst diese Zuordnung leider selber durchführen. Gehe dafür bitte auf git.rwth-aachen.de/profile, kopiere die User ID, trage sie unter orga.symposion.hilton.rwth-aachen.de/#/account ein und klicke auf 'Update information'.",
        })
        .then((response) => console.log(response.body))
        .catch(console.error); // Besuche dafür die Seite: orga.symposion.hilton.rwth-aachen.de/#/account");
    } catch (e) {
      console.warn("Couldn't send telegram message.");
    }
  }
};
