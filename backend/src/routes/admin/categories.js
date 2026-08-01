const express = require('express');
const router = express.Router();
const { getAllCategories, createCategory } = require('../../controllers/categoryController');

router.get('/', getAllCategories);
router.post('/', createCategory);

module.exports = router;