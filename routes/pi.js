// pi file taken from https://thestarman.pcministry.com/math/pi/picalcs.htm

var express = require('express');
var router = express.Router();

var pi_controller = require('../controllers/piController');

/* GET home page. */
router.get('/', pi_controller.pi_create_get);
router.post('/', pi_controller.pi_create_post);

router.post('/verify', pi_controller.pi_verify);

module.exports = router;