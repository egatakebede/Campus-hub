const test = require('node:test');
const assert = require('node:assert/strict');
const { fileFilter } = require('../../src/middleware/upload');

test('fileFilter rejects non-image files', (t) => {
  fileFilter({}, { mimetype: 'text/plain' }, (err, accept) => {
    assert.ok(err instanceof Error);
    assert.equal(accept, false);
    assert.match(err.message, /only image/i);
  });
});

test('fileFilter accepts image files when mimetype is allowed', (t) => {
  fileFilter({}, { mimetype: 'image/png' }, (err, accept) => {
    assert.equal(err, null);
    assert.equal(accept, true);
  });
});
