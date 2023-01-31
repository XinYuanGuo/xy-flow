import log from "@xy-flow/log";

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
        reject(err);
      });
    });
  }

  initArgs() {
    this._cmd = this._argv[this._argv.length - 1];
    this._argv = this._argv.slice(0, this._argv.length - 1);
    log.verbose("Command initArgs", this._cmd, this._argv);
  }

  init() {
    throw new Error("请实现init方法");
  }

  exec() {
    throw new Error("请实现exec方法");
  }
}
