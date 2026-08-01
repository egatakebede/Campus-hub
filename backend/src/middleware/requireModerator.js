const requireModerator = (req, res, next) => {
  if (!req.user || !req.user.isModerator) {
    return res.status(403).json({ error: "Moderator access required" });
  }

  return next();
};

module.exports = requireModerator;
