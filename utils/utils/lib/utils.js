import childProcess from "child_process";
import path from "path";

export function formatPath(p) {
  if (p && typeof p === "string") {
    const sep = path.sep;
    if (sep === "/") {
      return p;
    } else {
      return p.replace(/\\/g, "/");
    }
  }
  return p;
}

export function openBrowser(url) {
  let cmd = "";
  switch (process.platform) {
    case "win32":
      cmd = "start";
      break;
    case "darwin":
      cmd = "open";
      break;
    case "linux":
      cmd = "xdg-open";
      break;
  }
  if (cmd) {
    childProcess.exec(`${cmd} ${url}`);
  } else {
    throw new Error(`openBrowser方法检测到未兼容的平台 ${process.platform}`);
  }
}
