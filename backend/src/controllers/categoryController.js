const prisma = require("../lib/prisma");

async function getAllCategories(req, res){
    try{
        const categories = await prisma.category.findMany();
        return res.status(200).json(categories);
    } catch (error) {

        return res.status(500).json({ message: "Error fetching categories" });
    }
}

async function createCategory(req, res) {
    try {
        const { name, type } = req.body;
        const newCategory = await prisma.category.create({
            data: {
                name,
                type,
            },
        });
        return res.status(201).json(newCategory);
    } catch (error) {
        //console.error("Error creating category:", error);
        return res.status(500).json({ message: "Error creating category" });
    }
}

module.exports = {
    getAllCategories,
    createCategory,
};