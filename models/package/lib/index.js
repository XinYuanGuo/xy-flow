import { getNpmLatestVersion } from "@xy-flow/get-npm-info";
import fse from "fs-extra";
import path from "path";
import { pathExistsSync } from "path-exists";

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
    this.cacheFilePathPrefix = this.packageName.replace("/", "_");
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
    debugger;
  }
  async update() {}

  getRootFilePath() {}

  getSpecificCacheFilePath(packageVersion) {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`
    );
  }

  get cacheFilePath() {
    return path.resolve(
      this.storePath,
      `_${this.cacheFilePathPrefix}@${this.packageName}`
    );
  }
}
