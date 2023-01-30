#! /usr/bin/env node

import log from "@xy-flow/log";
import importLocal from "import-local";
import { fileURLToPath } from "url";
import main from "../lib/index.js";

const __filename = fileURLToPath(import.meta.url);

if (importLocal(__filename)) {
  log.info("cli", "使用的是本地cli版本");
}
main();
