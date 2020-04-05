var User = require('../models/user');
var Game = require('../models/game');
const async = require('async');

var levelNames = [
  'Unknown',
  'Lazy',
  'Baby',
  'Newcomer',
  'Undergraduate',
  'Not giving up?',
  'Little big',
  'Big little',
  'Serious player',
  'Big Boyz',
  'Elephant',
  'Monster',
  'Unstoppable',
  'Gold',
  'Diamond',
  'Masterclass',
  '1337'
]
function calculateLevel(xp) {
  return Math.floor((25 + Math.sqrt(625 + 100 * xp)) / 50)
}

function xpForLevel(level) {
  return 25 * level * level - 25 * level
}

function getNameFromLevel(level) {
  if(levelNames.length < level){
    return 'Hall of fame'
  }
  return levelNames[level-1];
}

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
    queries.push(function(cb){
      Game.aggregate([
        { $match: {user: req.user._id}},
        { $group: {_id:"$type", count: { $max: "$score"}}}
      ]).exec(function(err, r){
        if(err) throw cb(err);
        cb(null, r);
      })
    })
    async.parallel(queries, function(err, docs) {
      // if any query fails
      if (err) {
         res.render('dashboard', {user:req.user, err:err})
      }
      var plotx = [], ploty = [];
      docs[3].forEach(arr => {
        plotx.push(arr["_id"])
        ploty.push(arr["count"])
      })

      var xp = 0;
      for(var i=0;i<ploty.length;i++) {
        xp+=ploty[i];
      }
      for(var i=0;i<docs[1].length;i++){
        console.log(docs[1][i])
        xp+=0.1*docs[1][i].count
      }

      res.render('dashboard', {user:req.user, nbg:docs[0], sc: docs[1], games:docs[2], px: plotx, py: ploty, level:calculateLevel(xp), xp:xp, rank:getNameFromLevel(calculateLevel(xp)),
      nextlvl: xpForLevel(1+calculateLevel(xp))})
    })

  }else{
    res.redirect('/');
  }
}
