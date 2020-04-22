var express = require('express');
var router = express.Router();

var plate_controller = require('../controllers/carPlateController');

// create a new number game
router.get('/', plate_controller.plate_create_get);
router.post('/', plate_controller.plate_create_post);

// verify a played game
router.post('/verify', plate_controller.plate_verify);


module.exports = router;