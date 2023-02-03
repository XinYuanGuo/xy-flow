import exec from "@xy-flow/exec";
import { getNpmSatisfiesVersion } from "@xy-flow/get-npm-info";
import log from "@xy-flow/log";
import chalk from "chalk";
import { Command } from "commander";
import dotEnv from "dotenv";
import { createRequire } from "module";
import path from "path";
import { pathExistsSync } from "path-exists";
import rootCheck from "root-check";
import semver from "semver";
import userHome from "user-home";
const require = createRequire(import.meta.url);
const pkg = require("../package.json");
const program = new Command();

const DEFAULT_CLI_HOME = ".xy-flow";

async function main() {
  try {
    await prepare();
    registerCommand();
  } catch (error) {
    log.error(chalk.red(error.message));
  }
}

async function prepare() {
  checkPkgVersion();
  checkNodeVersion();
  checkRoot();
  checkUserHome();
  checkEnv();
  await checkGlobalUpdate();
}

function checkPkgVersion() {
  log.verbose("cli", `当前包版本v${pkg.version}`);
}

function checkNodeVersion() {
  log.verbose("cli", `当前node版本${process.version}`);
}

function checkRoot() {
  log.verbose("cli", "检查root账号并降级");
  rootCheck();
}

function checkUserHome() {
  log.verbose("cli", "检查用户主目录");
  if (!userHome || !pathExistsSync(userHome)) {
    throw new Error(`当前用户主目录不存在! 检查目录为: ${userHome}`);
  }
}

function checkEnv() {
  const dotEnvPath = path.resolve(userHome, DEFAULT_CLI_HOME, ".env");
  if (pathExistsSync(dotEnvPath)) {
    dotEnv.config({
      path: dotEnvPath,
    });
  }
  createDefaultConfig();
}

async function checkGlobalUpdate() {
  log.verbose("cli", "检查是否存在新版本");
  const { version: currentVersion, name: npmName } = pkg;
  const lastVersion = await getNpmSatisfiesVersion(currentVersion, npmName);
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(
      "cli",
      chalk.yellow(
        `发现最新版本！请手动更新${npmName}, 当前版本: ${currentVersion}, 最新版本: ${lastVersion}, 更新命令: npm update -g ${npmName}`
      )
    );
  }
}

function createDefaultConfig() {
  const cliConfig = {
    home: userHome,
  };
  if (process.env.CLI_HOME) {
    cliConfig["cliHome"] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig["cliHome"] = path.join(userHome, DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage("<command> [option]")
    .version(pkg.version, "-v, --version")
    .option("-d, --debug", "是否开启调试模式", false)
    .option("-tp, --targetPath [targetPath]", "本地开发使用monorepo路径");

  const featureCommand = registerFeatureCommand();
  const initCommand = registerInitCommand();
  const publishCommand = registerPublishCommand();

  program.addCommand(initCommand);
  program.addCommand(featureCommand);
  program.addCommand(publishCommand);

  program.on("option:debug", () => {
    if (program.opts().debug) {
      process.env.LOG_LEVEL = "verbose";
    } else {
      process.env.LOG_LEVEL = "info";
    }
    log.level = process.env.LOG_LEVEL;
    log.verbose("log level", "开启调试模式");
  });

  program.on("option:targetPath", () => {
    let targetPath = program.opts().targetPath;
    if (typeof targetPath === "boolean") {
      targetPath = process.cwd();
    }
    process.env.CLI_TARGET_PATH = targetPath;
  });

  program.on("command:*", (cmdObj) => {
    const availableCommands = program.commands.map((cmd) => cmd.name());
    log.error("cli", `未知的命令 ${cmdObj[0]}`);
    if (availableCommands.length > 0) {
      log.error("cli", `可用的命令: ${availableCommands}`);
    }
  });

  if (process.argv.length < 3) {
    program.outputHelp();
  } else {
    program.parse(process.argv);
  }
}

function registerFeatureCommand() {
  const feature = new Command("feature");
  feature
    .command("start <branchName>")
    .usage("<command> [option]")
    .description("拉取最新的主干分支并从主干分支创建新的功能分支")
    .action(exec);
  feature
    .command("finish")
    .usage("<command> [option]")
    .description("开发结束,检测测试分支并合入")
    .action(exec);

  return feature;
}

function registerInitCommand() {
  const init = new Command("init");
  init.description("初始化设定分支信息等").action(exec);
  return init;
}

function registerPublishCommand() {
  const init = new Command("publish");
  init.description("合并测试分支到主干分支,并打tag").action(exec);
  return init;
}

export default main;
