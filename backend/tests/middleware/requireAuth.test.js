const requireActive = require("../../src/middleware/requireActive");
const requireModerator = require("../../src/middleware/requireModerator");

describe("requireActive Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: {} };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  test("Should block PENDING users", () => {
    req.user.status = "PENDING";

    requireActive(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Account pending moderator approval",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("Should allow ACTIVE users", () => {
    req.user.status = "ACTIVE";

    requireActive(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test("Should block SUSPENDED users", () => {
    req.user.status = "SUSPENDED";

    requireActive(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("Should block BANNED users", () => {
    req.user.status = "BANNED";

    requireActive(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});


describe("requireModerator Middleware", () => {
  test("Should block non-moderator users", () => {
    const req = {
      user: {
        isModerator: false,
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    const next = jest.fn();

    requireModerator(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});