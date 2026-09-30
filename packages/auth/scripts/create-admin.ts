// Creates an admin, or resets an existing user's password and makes them admin.
//
//   npm run auth:create-admin -- --email ana@dsstudio.uy --name "Ana"
//
// The password is asked interactively (hidden), or read from ADMIN_PASSWORD for automation.
// Public sign-up is disabled, so this is the only way to get into the admin.

import { randomUUID } from "node:crypto";
import path from "node:path";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";

import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { config } from "dotenv";

import { PrismaClient } from "@ds-studio/database/client";

const MIN_PASSWORD_LENGTH = 10; // keep in sync with src/auth.ts

config({ path: path.resolve(import.meta.dirname, "../../../.env"), quiet: true });

const askHidden = (question: string) =>
  new Promise<string>((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const output = rl as unknown as { _writeToOutput: (text: string) => void };
    let prompted = false;
    output._writeToOutput = (text) => {
      // Print the prompt once, then hide every typed character
      if (!prompted) {
        process.stdout.write(text);
        prompted = true;
      }
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });

const main = async () => {
  const { values } = parseArgs({ options: { email: { type: "string" }, name: { type: "string" } } });
  const email = values.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Usage: npm run auth:create-admin -- --email you@example.com --name "Your name"');
  }

  const password = process.env.ADMIN_PASSWORD ?? (await askHidden(`Password for ${email}: `));
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`The password must have at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Set DATABASE_URL (in the repo-root .env)");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const passwordHash = await hashPassword(password);
    const existing = await prisma.user.findUnique({ where: { email } });

    await prisma.$transaction(async (tx) => {
      const user = existing
        ? await tx.user.update({
            where: { id: existing.id },
            data: { role: "ADMIN", deletedAt: null, ...(values.name ? { name: values.name } : {}) },
          })
        : await tx.user.create({
            data: { id: randomUUID(), email, name: values.name ?? email, emailVerified: true, role: "ADMIN" },
          });

      // Better Auth stores email+password logins as a "credential" account keyed by the user id
      const credential = await tx.account.findFirst({ where: { userId: user.id, providerId: "credential" } });
      if (credential) {
        await tx.account.update({ where: { id: credential.id }, data: { password: passwordHash } });
      } else {
        await tx.account.create({
          data: { id: randomUUID(), accountId: user.id, providerId: "credential", userId: user.id, password: passwordHash },
        });
      }

      // A password reset signs the user out everywhere
      await tx.session.deleteMany({ where: { userId: user.id } });
    });

    console.log(existing ? `Updated ${email}: password reset, role ADMIN.` : `Created admin ${email}.`);
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
