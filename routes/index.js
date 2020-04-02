var express = require('express');
const passport = require('passport');
const User = require('../models/user');
const Game = require('../models/game');
var auth = require('../utils/auth');
var dash = require('../controllers/dashboardController');
var async = require('async');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(req.sessionID);
  res.redirect('/game/');
});

router.get('/statistics', async (req, res) => {
  var queries = [];
  queries.push(function(cb){
    Game.aggregate([
      { $group: {_id:"$type", count: { $sum: 1}}}
    ]).exec(function(err, r){
      if(err) throw cb(err);
      cb(null, r);
    });
  });
  queries.push(function(cb) {
    User.countDocuments().exec(function(err, r){
      if(err) throw cb(err);
      cb(null, r);
    })
  })
  queries.push(function(cb){
    Game.aggregate([
      { $group: {_id:"$type", count: { $sum: "$score"}}}
    ]).exec(function(err, r){
      if(err) throw cb(err);
      cb(null, r);
    })
  })
  queries.push(function(cb){
    Game.aggregate([
      { $group: {_id:"$type", user: {$first: "$user"}, count: { $max: "$score"}}},
    ]).exec(function(err, r){
      if(err) throw cb(err);
      cb(null, r);
    })
  })
  async.parallel(queries, function(err, docs) {
    // if any query fails
    if (err) {
        res.render('statistics', {err:err});
    }
    var nbGames = docs[0]; // result of queries[0]
    var nbUsers = docs[1];
    var nbR = docs[2];
    console.log(docs[3]);
    res.render('statistics', {nbg: nbGames, nbu: nbUsers, nbr: nbR, user: req.user, bs:docs[3]});
  })
});


router.get('/about', function(req, res, next) {
  res.render('about',{user:req.user}); 
});

router.get('/login', function(req, res, next) {
  if(req.isAuthenticated())
    res.redirect('/')
  else
    res.render('login');
})

router.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login'
}));

router.get('/register', function(req,res,next) {
  if(req.isAuthenticated())
    res.redirect('/')
  else
    res.render('register');
});

router.post('/register', (request, response) => {
  if(request.body.password.length < 8){
    response.render('register',{err: 'Password must be at least 8 characters long.'})
  } else if(request.body.username.length < 2){
    response.render('register',{err: 'Username must be at least 2 characters long.'})
  }else{
    // Creates and saves a new user with a salt and hashed password
    User.register(new User({username: request.body.username}), request.body.password, function(err, user) {
        if (err) {
            console.log(err);
            return response.render('register');
        } else {
            passport.authenticate('local')(request, response, function() {
                response.redirect('/dashboard');
            });
        }
    });
  }
});

router.get('/dashboard', dash.get_dashboard);

router.get('/logout', (request, response) => {
  request.logout();
  response.redirect('/');
});

module.exports = router;
