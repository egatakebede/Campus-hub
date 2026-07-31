const prisma = require("../lib/prisma");
const nodeCron = require("node-cron");
async function checkExpiry() {
    try {
       const now = new Date();
       await prisma.listing.updateMany({
            where: {
                status: "ACTIVE",
                expiresAt: {
                    lte: now
                }
            },
            data: {
                status: "EXPIRED",
            },
        });
    } catch (error) {
        console.error("Error checking expiry:", error);
        return
    }
}
nodeCron.schedule("0 0 * * *", checkExpiry);