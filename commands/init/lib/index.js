import Command from "@xy-flow/command";
import log from "@xy-flow/log";
import fse from "fs-extra";
import inquirer from "inquirer";

export class InitCommand extends Command {
  constructor(argv) {
    super(argv);
  }

  async exec() {
    try {
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
      const allGitConfig = {
        ...this.allGitConfig,
        [git.remoteUrl]: projectGitSettings,
      };
      await fse.outputFile(this.configPath, JSON.stringify(this.config, {}, 2));
      log.success("init command", "初始化配置成功");
      if (!(await this.gitCls.checkBranchNameIsExist(this.gitConfig))) {
        log.warn("init", "当前不存在主干分支, 请设置主干分支并推送到远端");
      }
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
