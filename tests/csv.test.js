import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCsv } from '../src/lib/csv.js';
test('parseCsv removes a UTF-8 BOM and preserves quoted commas', () => {
    const rows = parseCsv('\uFEFFNAME,ADDR\r\n"City Hall","No. 1, City Road"\r\n');
    assert.deepEqual(rows, [{ NAME: 'City Hall', ADDR: 'No. 1, City Road' }]);
});
test('parseCsv handles escaped quotes and line breaks inside fields', () => {
    const rows = parseCsv('NAME,ADDR\n"Wi-Fi ""A""","First line\nSecond line"\n');
    assert.equal(rows[0]?.NAME, 'Wi-Fi "A"');
    assert.equal(rows[0]?.ADDR, 'First line\nSecond line');
});
