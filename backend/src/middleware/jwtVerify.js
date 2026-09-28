const jwt = require("jsonwebtoken");

const jwtVerify = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.telegramId || !decoded.status || decoded.isModerator === undefined) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = jwtVerify;
