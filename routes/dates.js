var express = require('express');
var router = express.Router();

var date_controller = require('../controllers/datesController');

// create a new number game
router.get('/', date_controller.date_create_get);
router.post('/', date_controller.date_create_post);

// verify a played game
router.post('/verify', date_controller.date_verify);

module.exports = router;