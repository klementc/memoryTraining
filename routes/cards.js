var express = require('express');
var router = express.Router();

var card_controller = require('../controllers/cardController');

// create a new card game
router.get('/', card_controller.card_create_get);
router.post('/', card_controller.card_create_post);


router.post('/verify', card_controller.card_verify)
module.exports = router;