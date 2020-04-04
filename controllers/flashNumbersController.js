const validator = require('express-validator');
var async = require('async');
var crypto = require('crypto');
var user = require('../models/user');
var Game = require('../models/game');
const { uuid } = require('uuidv4');

// rng using seed (not available with math.random)
const { Random, MersenneTwister19937 } = require("random-js");

/** form for creating a word game */
exports.flash_create_get = function(req, res) {
  res.render('flash_numbers_form', {title: 'Flash Numbers Game', user:req.user});
};

// when user submits the form to create a game
exports.flash_create_post = [
  // parse parameters
  validator.body('amount', 'Amount of numbers required').trim().isLength({min: 1}),
  validator.body('amount', 'Amount must be a number between 1 and 1000').isInt({min:1, max:1000}),
  validator.sanitizeBody('amount').escape(),

  validator.body('duration', 'Duration must be a number between 1 and 10').isInt({min:1, max:10}),
  validator.sanitizeBody('duration').escape(),
  
  validator.sanitizeBody('seed').escape(),


  (req, res, next) => {
    const err = validator.validationResult(req);

    if(! err.isEmpty()) {
        res.render('flash_numbers_form', {
            title:'Start a flash number Game',
            errors: err.array(), 
            user:req.user
        })
        return;
    }
    else {
        // start learn task
        var seed
        // create random seed if not provided
        if(req.body.seed)
            seed = req.body.seed;
        else
            seed = randU32Sync();
        
        // init session data
        req.session.fngid = uuid();
        req.session.fnseed = seed;
        req.session.fnamount = req.body.amount;
        req.session.fnbase = req.body.base;
        req.session.fnduration = req.body.duration;

        res.render('flash_numbers_play', {
            title: 'Play Flash Numbers', 
            duration: req.body.duration,
            seed:seed,
            size:req.body.amount,
            number_list: get_number_list_from_seed(MersenneTwister19937.seed(seed), req.body.amount, 1, false), 
            user:req.user
        });
    }
  }
];

/** Perform correction after user's recall validation */
exports.flash_verify = function(req, res) {
  var err=""
  
  if(! req.session.fnseed || ! req.session.fnamount) {
      err="Play a game before verifying";
      res.render('flash_numbers_recall',{
        title:'Validate your recall',
        err:err, 
        user:req.user
    });
  } else {      
    var recall;
    var nList = [];
    var score = 0;
    var lg=[];

    var correct = get_number_list_from_seed(MersenneTwister19937.seed(req.session.fnseed), req.session.fnamount, 1, false)

    for(var i=0;i<req.session.fnamount;i++) {
      var ok = true;
      
        if(undefined!=req.body[i] && (''+req.body[i]).split(" ")!=[]){
            var s = (''+req.body[i]).split(" ")
            nList.push(s);
            recall = true;
            for(var j=0;j<correct[i].length;j++) {
                if(s[j]==correct[i][j])
                    score++;
                else
                    ok=false;
            }
        }else{
            nList.push([]);
            ok=false;
        }
        if(ok) lg.push("bg-success");
        else lg.push("bg-danger");
    }

    // if this is the end and the user is register, add his score to the database
    if(req.isAuthenticated() && recall){
      user.findOne({username: req.user.username}).exec(function(err, u){
          if(! err){
              Game.findOne({gid: req.session.fngid}).exec(function(err, ga){
                  if(! err && ! ga){
                      var g = new Game({
                          user: u._id,
                          gid: req.session.fngid,
                          type: "Flashnumbers",
                          score: score,
                          maxscore: req.session.fnamount,
                          seed: req.session.fnseed,
                          date: Date.now(),
                          add: req.session.fnbase,
                          duration: req.session.fnduration
                      });
                      g.save(function (err, game) {
                          if (err) return console.error(err);
                          console.log("success!"+game);
                          Game.find({user: u._id}).exec(function(err,v){console.log(v)})
                        });
                  }
                })
          }
      })
    }

    res.render('flash_numbers_recall', {
        score: score,
        lg: lg,
        nList: nList,
        correct: get_number_list_from_seed(MersenneTwister19937.seed(req.session.fnseed), req.session.fnamount,1, req.session.fnbase),
        seed:req.session.fnseed,
        group_by: 1,
        amount: req.session.fnamount,
        recall: recall, 
        user:req.user
    });
  }
}

/** create random numbers to memorize from a seed */
function get_number_list_from_seed(seed, nLine, lSize, binary) {
  const random = new Random(seed);
  var nList = []
  for(var i=0; i<nLine; i++){
      nList.push([]);
      for(var j=0;j<lSize;j++) {
          nList[i].push(binary ? random.integer(0,1) : random.integer(0,9));
      }
  }
  return nList;
}

// create a random 32bit int (https://stackoverflow.com/questions/28061016/generate-random-32-bit-number-in-node)
function randU32Sync() {
return crypto.randomBytes(4).readUInt32BE(0, true);
}