import log from "@xy-flow/log";
import { openBrowser } from "@xy-flow/utils";
import { simpleGit } from "simple-git";

export default class Git {
  constructor() {
    this.git = simpleGit(process.cwd());
  }

  async prepare() {
    await this.getRemoteRepoUrl();
  }

  async getRemoteRepoUrl() {
    const remoteUrl = await (
      await this.git.listConfig()
    ).values?.[".git/config"]?.["remote.origin.url"];
    if (remoteUrl) {
      this.remoteUrl = remoteUrl.slice(0, remoteUrl.length - 4);
    } else {
      throw new Error("获取remoteUrl失败");
    }
  }

  handlePullRequest() {
    log.info("pull request", "打开git网页发起pull request");
    log.verbose("pull request", this.remoteUrl);
    openBrowser(`${this.remoteUrl}/compare/master...master`);
  }

  async checkBranchNameIsExist(newBranchName) {
    await this.git.fetch(["--all"]);
    const branchList = await this.git.branch(["-a"]);
    for (let i = 0; i < branchList.all.length; i++) {
      const branchName = branchList.all[i];
      if (
        branchName === newBranchName ||
        branchName === `remotes/origin/${newBranchName}`
      ) {
        return true;
      }
    }
    return false;
  }

  async pullBranch(branchName) {
    const isExist = await this.checkBranchNameIsExist(branchName);
    if (isExist) {
      if ((await this.git.branch(["-a"])).current === branchName) {
        await this.git.pull(["-r"]);
      } else {
        // 在同分支进行fetch
        await this.git.fetch(["origin", `${branchName}:${branchName}`]);
      }
      log.success("pull branch", `拉取${branchName}成功`);
    }
  }
}
