var express = require('express');
var router = express.Router();
var Game = require('../models/game');

// index page for games
router.get('/', function(req, res, next) {
    // fetch last games to print on home page
    Game.find({}).sort({date:-1})
                .limit(5)
                .populate('user')
                .exec(function(err,v){
                    res.render('index', {
                        title: 'Memgames', 
                        user:req.user, 
                        lastGames: v, 
                        err: err});});
});

module.exports = router;