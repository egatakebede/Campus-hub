const requireActive = (req, res, next) => {
  const status = req.user?.status;

  if (status === "PENDING") {
    return res
      .status(403)
      .json({ error: "Account pending moderator approval" });
  }

  if (status === "SUSPENDED") {
    return res
      .status(403)
      .json({ error: "Account suspended" });
  }

  if (status === "BANNED") {
    return res
      .status(403)
      .json({ error: "Account banned" });
  }

  return next();
};

module.exports = requireActive;