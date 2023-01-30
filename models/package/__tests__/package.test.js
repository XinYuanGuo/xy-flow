import package from '../src/package.js';
import { strict as assert } from 'assert';

assert.strictEqual(package(), 'Hello from package');
console.info("package tests passed");
