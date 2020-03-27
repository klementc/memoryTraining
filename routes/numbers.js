var express = require('express');
var router = express.Router();

var number_controller = require('../controllers/numbersController');

// index page for games
//router.get('/play', number_controller.number_play);
router.get('/create', number_controller.number_create_get);
router.post('/create', number_controller.number_create_post);

module.exports = router;