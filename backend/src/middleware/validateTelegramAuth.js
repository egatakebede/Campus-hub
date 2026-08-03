const crypto = require("crypto");

/**
 * Validates Telegram Mini App initData using HMAC-SHA-256
 */
const validateTelegramAuth = (req, res, next) => {
  try {
    const { initData } = req.body || {};

    // Check if initData exists
    if (!initData) {
      return res.status(401).json({ error: "Invalid Telegram auth" });
    }

    // Parse URL-encoded query string parameters
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");

    // Check if hash parameter exists
    if (!hash) {
      return res.status(401).json({ error: "Invalid Telegram auth" });
    }

    // Delete hash from key-value set before verification
    urlParams.delete("hash");

    // Sort remaining keys alphabetically and format as key=value separated by newlines
    const dataCheckArr = [];
    for (const [key, value] of urlParams.entries()) {
      dataCheckArr.push(`${key}=${value}`);
    }
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join("\n");

    // Secret Key = HMAC-SHA-256("WebAppData", BOT_TOKEN)
    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      // Do NOT log the token or detailed internal errors to client
      return res.status(401).json({ error: "Invalid Telegram auth" });
    }

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    // Calculated Hash = HMAC-SHA-256(secretKey, dataCheckString)
    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    // Secure timing-safe comparison (prevents timing attacks)
    const hashBuffer = Buffer.from(hash, "utf-8");
    const calculatedBuffer = Buffer.from(calculatedHash, "utf-8");

    if (
      hashBuffer.length !== calculatedBuffer.length ||
      !crypto.timingSafeEqual(hashBuffer, calculatedBuffer)
    ) {
      return res.status(401).json({ error: "Invalid Telegram auth" });
    }

    // Attach user object to req.telegramUser if user param exists
    const userParam = urlParams.get("user");
    if (userParam) {
      req.telegramUser = JSON.parse(userParam);
    }

    // Validation succeeded
    return next();
  } catch (err) {
    // Suppress verbose internal error details to prevent token leakage
    return res.status(401).json({ error: "Invalid Telegram auth" });
  }
};

module.exports = validateTelegramAuth;
