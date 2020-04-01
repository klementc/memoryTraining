var express = require('express');
var router = express.Router();

var grid_controller = require('../controllers/grid_controller');

router.get('/', function(req, res, next) {
  res.render('grid_form', {user:req.user});
});

router.post('/', grid_controller.grid_create_post);

module.exports = router;