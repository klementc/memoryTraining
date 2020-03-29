var express = require('express');
var router = express.Router();

var picture_controller = require('../controllers/pictureController');

router.get('/', function(req, res, next) {
  res.render('picture_form', {title:'Picture play!'});
});

router.post('/', picture_controller.picture_create_post);

module.exports = router;