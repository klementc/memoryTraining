var express = require('express');
var router = express.Router();

var flash_controller = require('../controllers/flashWordsController');

// create a new number game
router.get('/', flash_controller.flash_create_get);
router.post('/', flash_controller.flash_create_post);

module.exports = router;