import Command from "@xy-flow/command";
import log from "@xy-flow/log";

class FeatureFinishCommand extends Command {
  constructor(argv) {
    super(argv);
  }

  async exec() {
    try {
      // 1. 检查是否存在release/test分支, 不存在则从master创建并推到远端, 存在则合入
      const currentBranch = (await this.gitCls.git.branch(["-a"])).current;
      const isExist = await this.gitCls.checkBranchNameIsExist(
        this.gitConfig.devBranch
      );
      await this.gitCls.pullBranch(this.gitConfig.mainBranch);
      if (isExist) {
        await this.gitCls.pullBranch(this.gitConfig.devBranch);
        await this.gitCls.mergeAndCheckConflicted(
          this.gitConfig.devBranch,
          this.gitConfig.mainBranch,
          ["--no-ff"]
        );
      } else {
        log.info(
          "feature finish",
          `检测到不存在${this.gitConfig.devBranch}分支`
        );
        log.info(
          "feature finish",
          `创建${this.gitConfig.devBranch}分支: ${this.gitConfig.mainBranch} => ${this.gitConfig.devBranch}`
        );
        await this.gitCls.git.branch([
          this.gitConfig.devBranch,
          this.gitConfig.mainBranch,
        ]);
      }
      await this.gitCls.mergeAndCheckConflicted(
        this.gitConfig.devBranch,
        currentBranch,
        ["--no-ff"]
      );
      log.info("feature finish", `推送${this.gitConfig.devBranch}到远端`);
      await this.gitCls.git.push(
        "origin",
        `${this.gitConfig.devBranch}:${this.gitConfig.devBranch}`,
        ["--set-upstream"]
      );
      await this.gitCls.git.checkout(currentBranch);
      log.success("feature finish", "执行feature finish成功");
    } catch (error) {
      log.verbose("command exec error", error);
      log.error("command exec error", error.message);
    }
  }
}

export default function featureFinish(argv) {
  log.verbose("feature finish argv", argv);
  return new FeatureFinishCommand(argv);
}
