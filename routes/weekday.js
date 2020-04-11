var express = require('express');
var router = express.Router();

var date_controller = require('../controllers/weekdayController');

// create a new number game
router.get('/', date_controller.day_create_get);
router.post('/', date_controller.day_create_post);

// verify a played game
router.post('/verify', date_controller.day_verify);

module.exports = router;