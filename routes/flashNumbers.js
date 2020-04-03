var express = require('express');
var router = express.Router();

var flash_numbers_controller = require('../controllers/flashNumbersController');

// create a new number game
router.get('/', flash_numbers_controller.flash_create_get);
router.post('/', flash_numbers_controller.flash_create_post);

// verify a played game
router.post('/verify', flash_numbers_controller.flash_verify);


module.exports = router;