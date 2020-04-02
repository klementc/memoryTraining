var User = require('../models/user');
var Game = require('../models/game');
const async = require('async');


exports.get_dashboard = function(req, res){
  
  if(req.isAuthenticated()) {
    var games = "None"
    var queries = [];
    queries.push(function(cb){
      Game.aggregate([
        { $match: {user: req.user._id}},
        { $group: {_id:"$type", count: { $sum: 1}}}
      ]).exec(function(err, r){
        if(err) throw cb(err);
        cb(null, r);
      });
    });
    queries.push(function(cb){
      Game.aggregate([
        { $match: {user: req.user._id}},
        { $group: {_id:"$type", count: { $sum: "$score"}}}
      ]).exec(function(err, r){
        if(err) throw cb(err);
        cb(null, r);
      });
    })
    queries.push(function(cb){
      Game.find({user: req.user._id}).sort({date:-1}).limit(5).exec(function(err, r){
        if(err) throw cb(err);
        cb(null, r);
      });
    })
    async.parallel(queries, function(err, docs) {
      // if any query fails
      if (err) {
         res.render('dashboard', {user:req.user, err:err})
      }
      var nbGames = docs[0]; // result of queries[0]
      var nbUsers = docs[1];
      var nbR = docs[2];
      console.log("aa:"+docs[0]+"aaaaa"+docs[1]+"aaaaa"+docs[2]);
      res.render('dashboard', {user:req.user, nbg:docs[0], sc: docs[1], games:docs[2]})
    })

  }else{
    res.redirect('/');
  }
}
