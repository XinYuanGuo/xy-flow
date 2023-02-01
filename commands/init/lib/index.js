import Command from "@xy-flow/command";
import Git from "@xy-flow/git";
import log from "@xy-flow/log";
import fse from "fs-extra";
import inquirer from "inquirer";

export class InitCommand extends Command {
  constructor(argv) {
    super(argv);
  }

  async exec() {
    let git = new Git();
    try {
      await git.prepare();
      const projectGitSettings = await inquirer.prompt([
        {
          type: "input",
          name: "mainBranch",
          message: "main branch: ",
          default: "master",
        },
        {
          type: "input",
          name: "devBranch",
          message: "development branch: ",
          default: "release/dev",
        },
      ]);
      this.config = {
        ...this.allGitConfig,
        [git.remoteUrl]: projectGitSettings,
      };
      await fse.outputFile(this.configPath, JSON.stringify(this.config, {}, 2));
      log.success("init command", "初始化配置成功");
    } catch (error) {
      log.error("init command", error.message);
      log.verbose("init command", error);
    }
  }
}

export default function init(argv) {
  log.verbose(argv);
  return new InitCommand(argv);
}
