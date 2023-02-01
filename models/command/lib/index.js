import log from "@xy-flow/log";
import fse from "fs-extra";
import path from "path";
import semver from "semver";

const LOWEST_NODE_VERSION = "12.0.0";
export default class Command {
  constructor(argv) {
    if (!argv) {
      throw new Error("Command 参数不能为空!");
    }
    if (!Array.isArray(argv) || argv.length <= 0) {
      throw new Error("Command 参数必须为数组且不为空!");
    }
    this._argv = argv;
    this.runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => this.checkNodeVersion());
      chain = chain.then(() => this.initArgs());
      chain = chain.then(() => this.init());
      chain = chain.then(() => this.exec());
      chain = chain.then(resolve);
      chain.catch((err) => {
        log.error("command", err.message);
        log.verbose("command", err);
      });
    });
  }

  checkNodeVersion() {
    const currentVersion = process.version;
    const lowestVersion = LOWEST_NODE_VERSION;
    if (!semver.gte(currentVersion, lowestVersion)) {
      throw new Error(
        `imooc-cli 需要安装 v${lowestVersion} 以上版本的 Node.js`
      );
    }
  }

  initArgs() {
    this._cmd = this._argv[this._argv.length - 1];
    this._argv = this._argv.slice(0, this._argv.length - 1);
    log.verbose("Command initArgs", this._cmd, this._argv);
  }

  init() {
    const homePath = process.env.CLI_HOME_PATH;
    if (homePath) {
      this.configPath = path.resolve(homePath, "config.json");
      if (fse.existsSync(this.configPath)) {
        this.allGitConfig = JSON.parse(fse.readFileSync(this.configPath));
      } else {
        this.allGitConfig = {};
      }
    }
  }

  exec() {
    throw new Error("请实现exec方法");
  }
}
