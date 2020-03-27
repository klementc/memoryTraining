var express = require('express');
var router = express.Router();

var number_controller = require('../controllers/numbersController');

// create a new number game
router.get('/create', number_controller.number_create_get);
router.post('/create', number_controller.number_create_post);

// verify a played game
router.post('/verify', number_controller.number_verify);


module.exports = router;