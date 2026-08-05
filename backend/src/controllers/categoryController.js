const prisma = require("../lib/prisma");

async function getAllCategories(req, res) {
  try {
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
    return res.status(500).json({ message: "Error creating category" });
  }
}

async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;

    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (isActive !== undefined) dataToUpdate.isActive = isActive;

    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: dataToUpdate,
    });

    return res.status(200).json(updatedCategory);
  } catch (error) {
    return res.status(500).json({ message: "Error updating category" });
  }
}

async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting category" });
  }
}

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};