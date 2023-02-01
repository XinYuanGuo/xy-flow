import Command from "@xy-flow/command";
import Git from "@xy-flow/git";
import log from "@xy-flow/log";
import inquirer from "inquirer";

export class FeatureStartCommand extends Command {
  constructor(argv) {
    super(argv);
  }

  async exec() {
    this.gitCls = new Git();
    const [newBranchName] = this._argv;
    try {
      await this.gitCls.prepare();
      this.config = this.allGitConfig[this.gitCls.remoteUrl];
      log.verbose("feature start allGitConfig", this.allGitConfig);
      log.verbose("feature start config", this.config);
      log.verbose("feature start remoteUrl", this.gitCls.remoteUrl);
      if (this.config) {
        await this.handleGitOperation(newBranchName);
      } else {
        throw new Error("xy-flow还未初始化, 请先运行 xy-flow init");
      }
    } catch (error) {
      log.error("command feature start", error.message);
      log.verbose("command feature start", error);
    }
  }

  async handleGitOperation(newBranchName, isBranchNameRepeat = false) {
    if (!isBranchNameRepeat) {
      log.verbose(
        "command feature start",
        `切换到main branch: ${this.config.mainBranch}`
      );
      await this.gitCls.git.checkout(this.config.mainBranch);
      log.success("command feature start", `切换${this.config.mainBranch}成功`);
      log.verbose("command feature start", "拉取main branch remote最新");
      await this.gitCls.git.pull(["-r"]);
      log.success(
        "command feature start",
        `变基拉取${this.config.mainBranch}成功`
      );
    }
    log.verbose("command feature start", `检查新分支名是否重复`);
    const isRepeat = await this.gitCls.checkBranchNameIsRepeat(newBranchName);
    if (isRepeat) {
      const { reInputNewBranchName } = await inquirer.prompt([
        {
          type: "input",
          name: "reInputNewBranchName",
          message: "分支名重复, 请重新输入分支名",
        },
      ]);
      return this.handleGitOperation(reInputNewBranchName, true);
    }
    log.verbose("command feature start", "切出新分支");
    await this.gitCls.git.checkoutBranch(newBranchName, this.config.mainBranch);
    log.success(
      "command feature start",
      `新建分支成功 ${this.config.mainBranch} => ${newBranchName}`
    );
  }
}

export default function featureStart(argv) {
  log.verbose("feature-start argv", argv);
  return new FeatureStartCommand(argv);
}
