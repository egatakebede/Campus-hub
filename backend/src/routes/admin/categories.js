const express = require('express');
const router = express.Router();
const {
	getAllCategories,
	createCategory,
	updateCategory,
} = require('../../controllers/categoryController');

router.get('/', getAllCategories);
router.post('/', createCategory);
// TODO: add requireModerator middleware once wired by Nahom
router.patch('/:id', updateCategory);

module.exports = router;