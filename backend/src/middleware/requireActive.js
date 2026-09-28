const requireActive = (req, res, next) => {
  const status = req.user?.status;

  if (status !== "ACTIVE") {
    const messages = {
      PENDING:   "Account pending moderator approval",
      SUSPENDED: "Account suspended",
      BANNED:    "Account banned",
    };
    return res.status(403).json({
      error: messages[status] || "Account not active",
    });
  }

  return next();
};

module.exports = requireActive;
