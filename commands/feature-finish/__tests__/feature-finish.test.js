'use strict';

const featureFinish = require('..');
const assert = require('assert').strict;

assert.strictEqual(featureFinish(), 'Hello from featureFinish');
console.info("featureFinish tests passed");
