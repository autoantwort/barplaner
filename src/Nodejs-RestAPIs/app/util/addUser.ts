import { Barduty, Prisma, User, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";

import { prisma } from "../config/prisma";

// Post a User
exports.createAdmin = async (
  name: string,
  password: string,
  callback: (msg: string) => void
) => {
  if (password === undefined || name === undefined) {
    callback("password or name was not defined");
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name,
        password: passwordHash,
        sessionID: crypto.randomBytes(32).toString("hex"),
      },
    });

    callback("user created : " + user);

    if (user.active) {
      const barsInFuture = await prisma.bar.findMany({
        where: { start: { gt: new Date() } },
      });

      const promises: Prisma.Prisma__BardutyClient<Barduty>[] = [];

      for (const bar of barsInFuture) {
        promises.push(
          prisma.barduty.create({ data: { barID: bar.id, userID: user.id } })
        );
      }

      await Promise.all(promises);

      const roles = await prisma.role.findMany();

      const userRolePromises: Prisma.Prisma__UserRoleClient<UserRole>[] = [];

      for (const role of roles) {
        userRolePromises.push(
          prisma.userRole.create({
            data: { userId: user.id, roleName: role.name },
          })
        );
      }

      await Promise.all(userRolePromises);
    }
  } catch (e) {
    callback(e);
  }
};
