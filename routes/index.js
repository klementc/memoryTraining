var express = require('express');
const passport = require('passport');
const User = require('../models/user');
var auth = require('../utils/auth');
var dash = require('../controllers/dashboardController');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(req.sessionID);
  res.redirect('/game/');
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
