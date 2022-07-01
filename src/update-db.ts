import consola from "consola";
import { execa } from "execa";
import * as fs from "node:fs/promises";
import { resolve } from "pathe";

const fileExists = async (path: string): Promise<boolean> => {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
};

type Lockfiles = "npm" | "yarn" | "pnpm";

const detectLockfile = async (): Promise<Lockfiles> => {
  const packageDir = process.cwd();

  const lockfileNpm = resolve(packageDir, "package-lock.json");
  const lockfileShrinkwrap = resolve(packageDir, "npm-shrinkwrap.json");
  const lockfileYarn = resolve(packageDir, "yarn.lock");
  const lockfilePnpm = resolve(packageDir, "pnpm-lock.yaml");

  if (await fileExists(lockfilePnpm)) {
    return "pnpm";
  }
  if (await fileExists(lockfileNpm)) {
    return "npm";
  }
  if (await fileExists(lockfileYarn)) {
    return "yarn";
  }
  if (await fileExists(lockfileShrinkwrap)) {
    return "npm";
  }

  throw new Error(
    'No lockfile found. Run "npm install", "yarn install" or "pnpm install"'
  );
};

export const updateDb = async () => {
  const packager = await detectLockfile();
  consola.info(
    `${packager} detected. Running upgrade using package manager...`
  );
  switch (packager) {
    case "pnpm": {
      try {
        await execa("pnpm", [
          "--recursive",
          "update",
          "google-font-metadata",
        ]);
      } catch {
        throw new Error(
          "Unable to upgrade using pnpm. Try manually updating using 'pnpm update google-font-metadata'"
        );
      }

      break;
    }
    case "npm": {
      try {
        await execa("npm", [
          "--depth",
          "9999",
          "update",
          "google-font-metadata",
        ]);
      } catch {
        throw new Error(
          "Unable to upgrade using npm. Try manually updating using 'npm update google-font-metadata'"
        );
      }

      break;
    }
    case "yarn": {
      try {
        await execa("yarn", ["upgrade", "google-font-metadata"]);
      } catch {
        throw new Error(
          "Unable to upgrade using yarn. Try manually updating using 'yarn upgrade google-font-metadata'"
        );
      }

      break;
    }
    default: {
      throw new Error("No package manager found... Aborting...");
    }
  }
};
