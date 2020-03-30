var express = require('express');
var router = express.Router();

var flash_controller = require('../controllers/flashWordsController');

// create a new number game
router.get('/', flash_controller.flash_create_get);
router.post('/', flash_controller.flash_create_post);

// verify a played game
router.post('/verify', flash_controller.flash_verify);


module.exports = router;