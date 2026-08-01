const prisma = require("../lib/prisma");

async function getAllCategories(req, res){
    try{
        const categories = await prisma.category.findMany();
        return res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {
    getAllCategories,
};