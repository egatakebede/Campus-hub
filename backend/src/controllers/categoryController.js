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
        if (!name || !type) {
            return res.status(400).json({ message: "name and type are required" });
        }
        const normalizedType = type.toUpperCase();
        if (!["MARKETPLACE", "SERVICE"].includes(normalizedType)) {
            return res
                .status(400)
                .json({ message: "type must be MARKETPLACE or SERVICE" });
        }
        const newCategory = await prisma.category.create({
            data: {
                name,
                type: normalizedType,
            },
        });
        return res.status(201).json(newCategory);
    } catch (error) {
        //console.error("Error creating category:", error);
        return res.status(500).json({ message: "Error creating category" });
    }
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

async function updateCategory(req, res) {
    try {
        const { id } = req.params;
        const { name, isActive, active } = req.body;
        const parsedId = parseInt(id, 10);
        if (Number.isNaN(parsedId)) {
            return res.status(400).json({ message: "Invalid category id" });
        }

        const updateData = {};
        if (typeof name === "string" && name.trim().length > 0) {
            updateData.name = name.trim();
        }
        if (typeof isActive === "boolean") {
            updateData.isActive = isActive;
        } else if (typeof active === "boolean") {
            updateData.isActive = active;
        }

        if (Object.keys(updateData).length === 0) {
            return res
                .status(400)
                .json({ message: "At least one of name or isActive must be provided" });
        }

        const updatedCategory = await prisma.category.update({
            where: { id: parsedId },
            data: updateData,
        });

        return res.status(200).json(updatedCategory);
    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({ message: "Category not found" });
        }
        if (error.code === "P2002") {
            return res.status(409).json({ message: "Category with that name and type already exists" });
        }

        console.error("--- ERROR UPDATING CATEGORY ---");
        console.error(error);
        console.error("--------------------------------");

        return res.status(500).json({ message: "Error updating category" });
    }
}

module.exports = {
    getAllCategories,
    createCategory,
    updateCategory,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};