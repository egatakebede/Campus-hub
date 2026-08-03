require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const prisma = new PrismaClient({ adapter });

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

  for (const category of categories) {
    await prisma.category.create({
      data: category
    });
  }

  console.log("Categories created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
