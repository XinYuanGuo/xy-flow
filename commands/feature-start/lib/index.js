import Command from "@xy-flow/command";
import log from "@xy-flow/log";
import inquirer from "inquirer";

export class FeatureStartCommand extends Command {
  constructor(argv) {
    super(argv);
  }

  async exec() {
    const [newBranchName] = this._argv;
    try {
      await this.handleGitOperation(newBranchName);
    } catch (error) {
      log.error("command exec", error.message);
      log.verbose("command exec", error);
    }
  }

  async handleGitOperation(newBranchName, isBranchNameExist = false) {
    if (!isBranchNameExist) {
      await this.gitCls.pullBranch(this.gitConfig.mainBranch);
    }
    const prefix = this._cmd.opts().prefix;
    const branchName = `${prefix || "feature"}/${newBranchName}`;
    log.verbose("feature start", `检查新分支名${branchName}是否重复`);
    const isExist = await this.gitCls.checkBranchNameIsExist(branchName);
    if (isExist) {
      const { reInputNewBranchName } = await inquirer.prompt([
        {
          type: "input",
          name: "reInputNewBranchName",
          message: "分支名重复, 请重新输入分支名",
        },
      ]);
      return this.handleGitOperation(reInputNewBranchName, true);
    }
    log.verbose("feature start", "切出新分支");
    await this.gitCls.git.checkoutBranch(branchName, this.gitConfig.mainBranch);
    log.success(
      "feature start",
      `新建分支成功 ${this.gitConfig.mainBranch} => ${branchName}`
    );
  }
}

export default function featureStart(argv) {
  log.verbose("feature-start argv", argv);
  return new FeatureStartCommand(argv);
}
