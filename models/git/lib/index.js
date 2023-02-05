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

  handlePullRequest(branchA, branchB) {
    log.info("pull request", "打开git网页发起pull request");
    log.verbose("pull request", this.remoteUrl, branchA, branchB);
    openBrowser(`${this.remoteUrl}/compare/${branchA}...${branchB}`);
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
      log.info("git", `拉取${branchName}分支`);
      if ((await this.git.branch(["-a"])).current === branchName) {
        await this.git.pull(["-r"]);
      } else {
        // 在同分支进行fetch
        await this.git.fetch(["origin", `${branchName}:${branchName}`, "-f"]);
      }
      log.success("git", `拉取${branchName}成功`);
    } else {
      throw new Error(`pull branch ${branchName} 不存在！`);
    }
  }

  async delBranch(branchName, mainBranch, isDelOrigin = false) {
    const currentBranch = (await this.git.branch()).current;
    if (currentBranch === branchName) {
      await this.git.checkout(mainBranch);
    }
    await this.git.deleteLocalBranch(branchName);
    log.success("git", `删除${branchName}分支成功`);
    if (isDelOrigin) {
      await this.git.push(["origin", branchName, "-d"]);
      log.success("git", `删除远程${branchName}分支成功`);
    }
  }

  async mergeAndCheckConflicted(targetBranch, mergeBranch, options = []) {
    await this.git.checkout([targetBranch]);
    log.info("git", `合并${targetBranch}与${mergeBranch}`);
    await this.git.merge([mergeBranch, ...options]);
    const status = await this.git.status();
    if (status.conflicted.length > 0) {
      throw new Error(
        "检测到出现冲突, 请解决冲突后自行提交, 或使用 git merge --abort 取消合并"
      );
    } else {
      log.success("git", `合并${targetBranch}与${mergeBranch}成功`);
    }
  }
}
