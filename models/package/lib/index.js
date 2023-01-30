import { getDefaultRegistry, getNpmLatestVersion } from "@xy-flow/get-npm-info";
import { formatPath } from "@xy-flow/utils";
import fse from "fs-extra";
import { createRequire } from "module";
import npmInstall from "npminstall";
import path from "path";
import pathExists from "path-exists";
import pkgDir from "pkg-dir";
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
    if (this.storePath && !pathExists.sync(this.storePath)) {
      fse.mkdirpSync(this.storePath);
    }
    if (this.packageVersion === "latest") {
      this.packageVersion = await getNpmLatestVersion(this.packageName);
    }
  }

  async exists() {
    if (this.storePath) {
      await this.prepare();
      return pathExists.sync(this.cacheFilePath);
    } else {
      return pathExists.sync(this.targetPath);
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
    const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion);
    // 3. 如果不存在，则直接安装最新版本
    if (!pathExists.sync(latestFilePath)) {
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
      // 1. 获取package.json所在目录
      const dir = pkgDir.sync(targetPath);
      if (dir) {
        // 2. 读取package.json
        const pkgFile = require(path.resolve(dir, "package.json"));
        // 3. 寻找main/lib
        if (pkgFile && pkgFile.main) {
          // 4. 路径的兼容(macOS/windows)
          return formatPath(path.resolve(dir, pkgFile.main));
        }
      }
      return null;
    }
    if (this.storePath) {
      return _getRootFile(this.getCacheFilePath());
    } else {
      return _getRootFile(this.targetPath);
    }
  }

  getCacheFilePath(packageVersion = this.packageVersion) {
    return path.resolve(
      this.storePath,
      ".store",
      `${this.cacheFilePathPrefix}@${packageVersion}`
    );
  }
}
