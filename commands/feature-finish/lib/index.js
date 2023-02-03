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
      if (isExist) {
        await this.gitCls.pullBranch(this.gitConfig.devBranch);
      } else {
        log.info(
          "feature finish",
          `检测到不存在${this.gitConfig.devBranch}分支`
        );
        await this.gitCls.pullBranch(this.gitConfig.mainBranch);
        log.info(
          "feature finish",
          `创建${this.gitConfig.devBranch}分支: ${this.gitConfig.mainBranch} => ${this.gitConfig.devBranch}`
        );
        await this.gitCls.git.branch([
          this.gitConfig.devBranch,
          this.gitConfig.mainBranch,
        ]);
        log.success(
          "feature finish",
          `创建${this.gitConfig.devBranch}分支成功`
        );
      }
      log.info(
        "feature finish",
        `合并${this.gitConfig.devBranch}与${currentBranch}`
      );
      await this.gitCls.git.checkout([this.gitConfig.devBranch]);
      await this.gitCls.git.merge([currentBranch, "--no-ff"]);
      log.success(
        "feature finish",
        `合并${this.gitConfig.devBranch}与${currentBranch}成功`
      );
      log.info("feature finish", `推送${this.gitConfig.devBranch}到远端`);
      await this.gitCls.git.push(
        "origin",
        `${this.gitConfig.devBranch}:${this.gitConfig.devBranch}`,
        ["--set-upstream"]
      );
      log.success("feature finish", `推送${this.gitConfig.devBranch}成功`);
      await this.gitCls.git.checkout(currentBranch);
    } catch (error) {
      log.verbose("command exec error", error);
      log.error("command exec error", error.message);
    }
  }
}

export default function featureFinish(argv) {
  log.verbose("cfeature finish argv", argv);
  return new FeatureFinishCommand(argv);
}
