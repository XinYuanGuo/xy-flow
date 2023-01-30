'use strict';

const featureStart = require('..');
const assert = require('assert').strict;

assert.strictEqual(featureStart(), 'Hello from featureStart');
console.info("featureStart tests passed");
