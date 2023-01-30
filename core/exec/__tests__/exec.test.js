import exec from '../src/exec.js';
import { strict as assert } from 'assert';

assert.strictEqual(exec(), 'Hello from exec');
console.info("exec tests passed");
