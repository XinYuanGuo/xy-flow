import log from "@xy-flow/log";
import Package from "@xy-flow/package";
import path from "path";

const SETTINGS = {
  "xy-flow-feature-start": "@xy-flow/feature-start",
  "xy-flow-feature-finish": "@xy-flow/feature-finish",
  "xy-flow-init": "@xy-flow/init",
  "xy-flow-publish": "@xy-flow/publish",
};
const CACHE_DIR = "dependencies";

export default async function exec() {
  try {
    let storePath = "";
    let pkg = undefined;
    let targetPath = process.env.CLI_TARGET_PATH;
    const homePath = process.env.CLI_HOME_PATH;
    const cmdObj = arguments[arguments.length - 1];
    const cmdName = getCommandName(cmdObj);
    const packageName = SETTINGS[cmdName];
    const packageVersion = "latest";

    if (!targetPath) {
      targetPath = path.resolve(homePath, CACHE_DIR);
      storePath = path.resolve(targetPath, "node_modules");
      pkg = new Package({
        packageName,
        storePath,
        targetPath,
        packageVersion,
      });

      if (await pkg.exists()) {
        await pkg.update();
      } else {
        await pkg.install();
      }
    } else {
      pkg = new Package({
        packageName,
        storePath,
        targetPath,
        packageVersion,
      });
    }
    log.verbose("exec", `targetPath ${targetPath}`);
    log.verbose("exec", `homePath ${homePath}`);
    log.verbose("exec", `packageName ${packageName}`);

    const rootFile = pkg.getRootFilePath();
    if (rootFile) {
      try {
        const command = await import(rootFile);
        command.default(Array.from(arguments));
      } catch (error) {
        log.error("exec", error.message);
      }
    }
  } catch (error) {
    log.verbose("exec", error);
    log.error("exec", error?.message);
    if (error?.config?.url) {
      console.log(`Request Fail URL: ${error.config.url}`);
    }
  }
}

function getCommandName(cmdObj) {
  const cmdName = cmdObj.name();
  let prefix = "";
  if (cmdObj.parent) {
    prefix = `${getCommandName(cmdObj.parent)}-`;
  }
  return prefix + cmdName;
}
