import Command from "@xy-flow/command";
import log from "@xy-flow/log";
import inquirer from "inquirer";

class BugfixCommand extends Command {
  constructor(argv) {
    super(argv);
  }

  async exec() {
    try {
      const { mainBranch, devBranch } = this.gitConfig;
      const currentBranch = (await this.gitCls.git.branch()).current;
      await this.gitCls.pullBranch(devBranch);
      if (currentBranch === mainBranch || currentBranch === devBranch) {
        throw new Error("请将当前分支切换到正在开发的分支");
      }
      const logs = (
        await this.gitCls.git.log([`${devBranch}..${currentBranch}`])
      ).all;
      const { cherryPickLogsHash } = await inquirer.prompt([
        {
          type: "checkbox",
          message: `请选择合入${devBranch}的commit(默认全选): `,
          name: "cherryPickLogsHash",
          choices: logs.map((l) => ({
            value: l.hash,
            name: `${l.hash.slice(0, 6)} -- ${
              l.message
            } -- ${this.formatGitDate(l.date)}`,
            checked: true,
          })),
        },
      ]);
      console.log("logs", logs);
      cherryPickLogsHash.reverse();
      console.log("cherryPickLogsHash", cherryPickLogsHash);
      //   log.info("bugfix", `切换${devBranch}分支`);
      //   await this.gitCls.git.checkout(devBranch);
      log.info("bugfix", `rebase -i`);
      await this.gitCls.git.rebase(["-i", cherryPickLogsHash[0]]);
      log.info("bugfix", `推送${devBranch}分支`);
      await this.gitCls.git.push();
      log.info("bugfix", `切换${currentBranch}分支`);
      await this.gitCls.git.checkout(currentBranch);
    } catch (error) {
      log.verbose("command exec error", error);
      log.error("command exec error", error.message);
    }
  }

  formatGitDate(date) {
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  }
}

export default function bugfix(argv) {
  log.verbose("bugfix", argv);
  return new BugfixCommand(argv);
}
