const jwt = require("jsonwebtoken");
const jwtVerify = require("../../src/middleware/jwtVerify");

describe("jwtVerify Middleware", () => {
  const MOCK_SECRET = "test-secret";
  let req, res, next;

  beforeEach(() => {
    process.env.JWT_SECRET = MOCK_SECRET;

    req = {
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  test("1. Should return 401 when token is missing", () => {
    jwtVerify(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("2. Should return 401 for invalid token", () => {
    req.headers.authorization = "Bearer invalid-token";

    jwtVerify(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("3. Should return 401 for expired token", () => {
    const token = jwt.sign(
      { id: 1 },
      MOCK_SECRET,
      { expiresIn: "-1s" }
    );

    req.headers.authorization = `Bearer ${token}`;

    jwtVerify(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("4. Should attach user and continue for valid token", () => {
    const payload = {
      id: 1,
      status: "ACTIVE",
      isModerator: false,
    };

    const token = jwt.sign(payload, MOCK_SECRET);

    req.headers.authorization = `Bearer ${token}`;

    jwtVerify(req, res, next);

    expect(req.user).toEqual(expect.objectContaining(payload));
    expect(next).toHaveBeenCalledTimes(1);
  });
});