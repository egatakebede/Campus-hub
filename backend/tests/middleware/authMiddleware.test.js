const requireActive = require("../../src/middleware/requireActive");
const requireModerator = require("../../src/middleware/requireModerator");

describe("Auth & Permission Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe("requireActive", () => {
    it("should call next() if user status is ACTIVE", () => {
      req = { user: { status: "ACTIVE" } };
      requireActive(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should return 403 for PENDING user", () => {
      req = { user: { status: "PENDING" } };
      requireActive(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Account pending moderator approval",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 403 for SUSPENDED user", () => {
      req = { user: { status: "SUSPENDED" } };
      requireActive(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Account suspended" });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 403 for BANNED user", () => {
      req = { user: { status: "BANNED" } };
      requireActive(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Account banned" });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requireModerator", () => {
    it("should call next() if user isModerator is true", () => {
      req = { user: { isModerator: true } };
      requireModerator(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should return 403 if user is not a moderator", () => {
      req = { user: { isModerator: false } };
      requireModerator(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
