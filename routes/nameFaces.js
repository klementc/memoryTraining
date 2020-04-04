var express = require('express');
var router = express.Router();

var nf_controller = require('../controllers/nameFacesController');

// create a new name and faces game
router.get('/', nf_controller.nf_create_get);
router.post('/', nf_controller.nf_create_post);


router.post('/verify', nf_controller.nf_verify)
module.exports = router;