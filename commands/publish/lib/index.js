import Command from "@xy-flow/command";
import log from "@xy-flow/log";
import inquirer from "inquirer";
import semver from "semver";

class PublishCommand extends Command {
  constructor(argv) {
    super(argv);
  }

  async exec() {
    try {
      const { devBranch, mainBranch } = this.gitConfig;
      await this.gitCls.pullBranch(devBranch);
      await this.gitCls.pullBranch(mainBranch);
      const result = await this.gitCls.git.diffSummary([mainBranch, devBranch]);
      if (result.changed || result.deletions || result.insertions) {
        log.warn("publish", "主干分支应为保护分支, 请先在网页上进行pr");
        this.gitCls.handlePullRequest(mainBranch, devBranch);
        return;
      } else {
        // 主分支已通过pr合并测试分支
        const latestTag = (await this.getLatestTag()).replace("\n", "");
        log.verbose("publish", `latestTag:${latestTag}`);
        if (latestTag) {
          // 比对上个tag是否和测试分支一致，一致则测试分支为未删除的旧分支
          const result = await this.gitCls.git.diffSummary([
            latestTag,
            devBranch,
          ]);
          if (!result.changed && !result.deletions && !result.insertions) {
            log.warn(
              "publish",
              `${this.gitConfig.mainBranch}已合入${this.gitConfig.devBranch}`
            );
            const { isDelDevBranch } = await inquirer.prompt([
              {
                type: "expand",
                name: "isDelDevBranch",
                message: `是否要删除${devBranch}分支`,
                choices: [
                  {
                    value: true,
                    key: "Y",
                  },
                  {
                    value: false,
                    key: "N",
                  },
                ],
              },
            ]);
            if (isDelDevBranch) {
              this.gitCls.delBranch(devBranch, mainBranch, true);
            }
            return;
          }
        }

        // 获取新tag名称
        const formatLatestVersion = semver.clean(latestTag);
        let newTag = "";
        if (formatLatestVersion) {
          const patchVersion = semver.inc(latestTag, "patch");
          const minorVersion = semver.inc(latestTag, "minor");
          const majorVersion = semver.inc(latestTag, "major");

          const { updatedVersion } = await inquirer.prompt([
            {
              type: "list",
              name: "updatedVersion",
              message: "自动升级版本，请选择升级版本类型: ",
              choices: [
                {
                  value: patchVersion,
                  name: `Patch ${latestTag} => ${patchVersion}`,
                },
                {
                  value: minorVersion,
                  name: `Minor ${latestTag} => ${minorVersion}`,
                },
                {
                  value: majorVersion,
                  name: `Major ${latestTag} => ${majorVersion}`,
                },
              ],
            },
          ]);
          newTag = updatedVersion;
        } else {
          while (tag) {
            const { firstTag } = await inquirer.prompt([
              {
                type: "input",
                name: "firstTag",
                default: "1.0.0",
                message: "请输入tag名称(格式:大版本.中版本.小版本):",
              },
            ]);
            newTag = semver.clean(firstTag);
          }
        }
        // 获取tag commit信息
        const { tagCommit } = await inquirer.prompt([
          {
            type: "input",
            name: "tagCommit",
            message: "请输入tag commit信息: ",
            default: `v ${newTag}`,
          },
        ]);

        await this.gitCls.git.checkout(this.gitConfig.mainBranch);
        log.info("publish", `创建新tag${newTag}`);
        await this.gitCls.git.tag([newTag, "-m", tagCommit]);
        log.info("publish", `推送tag`);
        await this.gitCls.git.pushTags();
        log.info("publish", `删除本地和远程仓库测试分支`);
        this.gitCls.delBranch(devBranch, mainBranch, true);
        const localBranchArr = (await this.gitCls.git.branch(["-l"])).all;
        const { delBranchArr } = await inquirer.prompt([
          {
            type: "checkbox",
            name: delBranchArr,
            message: "请选择要删除的本地分支",
            choices: localBranchArr
              .filter((l) => l.name !== mainBranch)
              .map((l) => ({
                name: l.name,
              })),
          },
        ]);
        if (delBranchArr && delBranchArr.length > 0) {
          for (let i = 0; i < delBranchArr.length; i++) {
            const b = delBranchArr[i];
            await this.gitCls.delBranch(b, mainBranch);
          }
          log.success(
            "publish",
            `成功删除本地分支： ${delBranchArr.join(",")}`
          );
        }
      }
    } catch (error) {
      log.verbose("command exec error", error);
      log.error("command exec error", error.message);
    }
  }

  async getLatestTag() {
    return await this.gitCls.git.raw("describe", "--abbrev=0");
  }
}

export default function publish(argv) {
  log.verbose("publish argv", argv);
  return new PublishCommand(argv);
}
