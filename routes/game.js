var express = require('express');
var router = express.Router();

// index page for games
router.get('/', function(req, res, next) {
    res.render('index', {title: 'Memgames'});
});

module.exports = router;