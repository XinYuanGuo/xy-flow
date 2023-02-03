'use strict';

const bugfix = require('..');
const assert = require('assert').strict;

assert.strictEqual(bugfix(), 'Hello from bugfix');
console.info("bugfix tests passed");
