var user = require('../models/user');
var Game = require('../models/game');


exports.get_dashboard = function(req, res){
  if(req.isAuthenticated()) {
    var games = "None"
    user.findOne({username: req.user.username}).exec(function(err, u){
      if(! err){
          console.log(u._id);
          Game.find({user: u._id}).sort({date:-1}).limit(5).exec(function(err,v){ console.log(v);
            res.render('dashboard', {user:req.user, games:v});})
      }else console.log(err);
    });

  }else{
    res.redirect('/');
  }
}
