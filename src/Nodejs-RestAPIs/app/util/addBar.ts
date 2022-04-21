import * as Telegram from "./telegram.js";
import * as Newsletter from "./newsletter.js";

import { prisma } from "../config/prisma.js";

import * as Util from "../util/cleaning.js";
import { Bar, Barduty, Prisma } from "@prisma/client";

const barAddedListener = [];
const barChangedListener = [];

export const addBar = async (barData, numberOfPersonsToClean) => {
  const bar = await prisma.bar.create({
    data: barData,
  });

  Newsletter.sendEmailForBar(bar);
  const activeUsers = await prisma.user.findMany({ where: { active: true } });

  const promises: Prisma.Prisma__BardutyClient<Barduty>[] = [];

  for (const user of activeUsers) {
    promises.push(
      prisma.barduty.create({ data: { barID: bar.id, userID: user.id } })
    );
  }

  await Promise.all(promises);

  console.log("## numberOfPersonsToClean", numberOfPersonsToClean);

  if (numberOfPersonsToClean !== undefined && numberOfPersonsToClean > 0) {
    const userIDs = await Util.computeCleaning(bar.id, numberOfPersonsToClean);
    Telegram.barAdded(bar);

    return userIDs;
  }

  Telegram.barAdded(bar);
  barAddedListener.forEach((c) => c(bar));

  return bar;
};

export const onBarAdded = (callback) => barAddedListener.push(callback);

/**
 * Must be called to change a bar object. Checks if there are changes and do
 * additional things like changing newsletters, deleting bar duties, ...
 *
 * @param {Bar} barObject the bar model instance
 * @param {object} newBarData the new bar data with the same fields as the bar model instance
 */
export const changeBar = async (barObject: Bar, newBarData: Bar) => {
  if (barObject.facebookEventID === null) {
    console.warn(
      "Update a bar object with facebook data that has no facebookEventID"
    );
  }
  if (!barObject.canceled && newBarData.canceled) {
    // if the bar was cancelled, delete all bar duties
    prisma.barduty.deleteMany({ where: { barID: barObject.id } });
  }

  let changed = false;
  for (let p in newBarData) {
    if (barObject[p] !== newBarData[p]) {
      changed = true;
    }
  }

  if (changed) {
    barObject = await prisma.bar.update({
      data: newBarData,
      where: { id: barObject.id },
    });

    Newsletter.sendEmailForBar(barObject);
    barChangedListener.forEach((c) => c(barObject));
  }
};

export const onBarChanged = (callback) => barChangedListener.push(callback);
