const { fileFilter } = require('../../src/middleware/upload');

describe('upload middleware', () => {
  test('fileFilter rejects non-image files', () => {
    const callback = jest.fn();

    fileFilter({}, { mimetype: 'text/plain' }, callback);

    expect(callback).toHaveBeenCalledWith(expect.any(Error), false);
    expect(callback.mock.calls[0][0].message).toMatch(/only image/i);
  });

  test('fileFilter accepts image files when mimetype is allowed', () => {
    const callback = jest.fn();

    fileFilter({}, { mimetype: 'image/png' }, callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });
});
