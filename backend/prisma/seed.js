require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const prisma = new PrismaClient({ adapter });

function parseAdminTelegramIds() {
  const configuredIds = String(process.env.ADMIN_TELEGRAM_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const validIds = [];

  for (const rawId of configuredIds) {
    if (!/^\d+$/.test(rawId)) {
      console.warn(`Ignoring invalid ADMIN_TELEGRAM_IDS value: ${rawId}`);
      continue;
    }

    validIds.push(rawId);
  }

  return [...new Set(validIds)];
}

async function seedAdmins() {
  const adminTelegramIds = parseAdminTelegramIds();

  if (!adminTelegramIds.length) {
    console.log("No valid ADMIN_TELEGRAM_IDS configured; skipping moderator seeding");
    return;
  }

  for (const rawId of adminTelegramIds) {
    const telegramId = BigInt(rawId);

    await prisma.user.upsert({
      where: { telegramId },
      update: { isModerator: true },
      create: {
        telegramId,
        name: "Admin",
        username: null,
        department: "",
        yearOfStudy: 0,
        status: "ACTIVE",
        isModerator: true,
        showPhone: true,
      },
    });
  }

  console.log(`Seeded moderator access for ${adminTelegramIds.length} admin user(s)`);
}

async function main() {
  const categories = [
    { name: "Electronics", type: "MARKETPLACE" },
    { name: "Books", type: "MARKETPLACE" },
    { name: "Clothing", type: "MARKETPLACE" },
    { name: "Food", type: "MARKETPLACE" },
    { name: "Furniture", type: "MARKETPLACE" },
    { name: "Tutoring", type: "SERVICE" },
    { name: "Programming", type: "SERVICE" },
    { name: "Design", type: "SERVICE" },
    { name: "Photography", type: "SERVICE" }
  ];

  await seedAdmins();

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name_type: { name: category.name, type: category.type } },
      update: {},
      create: category,
    });
  }

  console.log("Categories created successfully");
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = {
  parseAdminTelegramIds,
  seedAdmins,
  main,
};
