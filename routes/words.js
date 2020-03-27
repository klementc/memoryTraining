var express = require('express');
var router = express.Router();

var word_controller = require('../controllers/wordsController');

// create a new number game
router.get('/create', word_controller.word_create_get);
router.post('/create', word_controller.word_create_post);

// verify a played game
router.post('/verify', word_controller.word_verify);

module.exports = router;