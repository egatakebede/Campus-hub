function getAdminTelegramIds() {
  return [...new Set(
    String(process.env.ADMIN_TELEGRAM_IDS ?? "")
      .split(/[\s,]+/)
      .map((id) => id.trim())
      .filter((id) => /^\d{1,20}$/.test(id)),
  )];
}

async function notifyAdminsOfVerification(user) {
  const botToken = process.env.BOT_TOKEN;
  const adminIds = getAdminTelegramIds();
  if (!botToken || !adminIds.length) return { sent: 0 };

  const frontendUrl = process.env.FRONTEND_URL || "https://campus-hub2026.vercel.app";
  const reviewUrl = new URL("/admin/verifications", frontendUrl).toString();
  const text = [
    "New student verification request",
    `Name: ${user.name}`,
    `Department: ${user.department || "Not provided"}`,
    "Review it in the Campus Hub admin queue.",
  ].join("\n");

  const results = await Promise.allSettled(adminIds.map(async (chatId) => {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: {
          inline_keyboard: [[
            { text: "Review verification queue", web_app: { url: reviewUrl } },
          ]],
        },
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error(`Telegram verification notification failed (HTTP ${response.status})`);
      return false;
    }
    return true;
  }));

  const sent = results.filter((result) => result.status === "fulfilled" && result.value).length;
  const failed = results.length - sent;
  if (failed) console.error(`Telegram verification notifications failed for ${failed} admin(s)`);
  return { sent, failed };
}

module.exports = { getAdminTelegramIds, notifyAdminsOfVerification };