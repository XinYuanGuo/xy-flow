import { getDefaultRegistry, getNpmLatestVersion } from "@xy-flow/get-npm-info";
import { formatPath } from "@xy-flow/utils";
import fse from "fs-extra";
import { createRequire } from "module";
import npmInstall from "npminstall";
import path from "path";
import { pathExistsSync } from "path-exists";
const require = createRequire(import.meta.url);

export default class Package {
  constructor(
    options = { targetPath, storePath, packageName, packageVersion }
  ) {
    if (!options) {
      throw new Error("Package实例化必须包含options参数");
    }

    this.targetPath = options.targetPath;
    this.storePath = options.storePath;
    this.packageName = options.packageName;
    this.packageVersion = options.packageVersion;
    this.cacheFilePathPrefix = this.packageName.replace("/", "+");
  }

  async prepare() {
    if (this.storePath && !pathExistsSync(this.storePath)) {
      fse.mkdirpSync(this.storePath);
    }
    if (this.packageVersion === "latest") {
      this.packageVersion = await getNpmLatestVersion(this.packageName);
    }
  }

  async exists() {
    if (this.storePath) {
      await this.prepare();
      return pathExistsSync(this.cacheFilePath);
    } else {
      return pathExistsSync(this.targetPath);
    }
  }
  async install() {
    await this.prepare();
    return npmInstall({
      root: this.targetPath,
      storeDir: this.storePath,
      registry: getDefaultRegistry(),
      pkgs: [
        {
          name: this.packageName,
          version: this.packageVersion,
        },
      ],
    });
  }
  async update() {
    await this.prepare();
    // 1. 获取最新的npm模块版本号
    const latestPackageVersion = await getNpmLatestVersion(this.packageName);
    // 2. 查询最新版本号对应的路径是否存在
    const latestFilePath = this.getRootPath(latestPackageVersion);
    // 3. 如果不存在，则直接安装最新版本
    if (!pathExistsSync(latestFilePath)) {
      await npmInstall({
        root: this.targetPath,
        storeDir: this.storePath,
        registry: getDefaultRegistry(),
        pkgs: [
          {
            name: this.packageName,
            version: latestPackageVersion,
          },
        ],
      });
      this.packageVersion = latestPackageVersion;
    } else {
      this.packageVersion = latestPackageVersion;
    }
  }

  getRootFilePath() {
    function _getRootFile(targetPath) {
      const pkgFile = require(path.resolve(targetPath, "package.json"));
      if (pkgFile && pkgFile.main) {
        return formatPath(path.resolve(targetPath, pkgFile.main));
      }
      return null;
    }
    return _getRootFile(this.getRootPath());
  }

  getRootPath(packageVersion = this.packageVersion) {
    let targetPath = "";
    if (this.storePath) {
      targetPath = path.resolve(
        this.storePath,
        ".store",
        `${this.cacheFilePathPrefix}@${packageVersion}`
      );
    } else {
      targetPath = this.targetPath;
    }
    return `${targetPath}/node_modules/${this.packageName}`;
  }
}
