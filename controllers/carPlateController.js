const validator = require('express-validator');
var async = require('async');
var crypto = require('crypto');
const { uuid } = require('uuidv4');
var user = require('../models/user');
var Game = require('../models/game');

// rng using seed (not available with math.random)
const { Random, MersenneTwister19937 } = require("random-js");

// create a random 32bit int (https://stackoverflow.com/questions/28061016/generate-random-32-bit-number-in-node)
function randU32Sync() {
  return crypto.randomBytes(4).readUInt32BE(0, true);
}

/** form for creating a word game */
exports.plate_create_get = function(req, res) {
  res.render('plates_form', {title: 'Start a Plate Game', user:req.user});
};


// when user submits the form to create a game
exports.plate_create_post = [
  // parse parameters
  validator.body('amount', 'Amount of plates required').trim().isLength({min: 1}),
  validator.body('amount', 'Amount must be a number between 1 and 1000').isInt({min:1, max:1000}),
  validator.sanitizeBody('amount').escape(),

  validator.body('durationm', 'Duration (min) must be a number between 0 and 180').isInt({min:0, max:180}),
  validator.sanitizeBody('durationm').escape(),

  validator.body('durations', 'Duration (s) must be a number between 0 and 59').isInt({min:0, max:59}),
  validator.sanitizeBody('durations').escape(),

  validator.body('nationality','Please select a valid nationality').isIn(['en-us','fr']),
  validator.sanitizeBody('nationality').escape(),

  validator.sanitizeBody('seed').escape(),

  // create the game or show errors
  (req, res, next) => {
      const err = validator.validationResult(req);

      if(! err.isEmpty()) {
          res.render('plates_form', {
              title:'Start a Plate Game',
              errors: err.array(), 
              user:req.user
          })
          return;
      }else {
            var seed;

            // create random seed if not provided
            if(req.body.seed)
                seed = req.body.seed;
            else
                seed = randU32Sync();

            // set session data
            req.session.plgid = uuid();
            req.session.plamount = req.body.amount;
            req.session.plseed = seed;
            req.session.plsize = req.body.amount;
            req.session.plnationality = req.body.nationality;
            req.session.plduration = (Number(req.body.durationm)*60)+Number(req.body.durations);
            // render game page
            res.render('plates_play', {
                title: 'Play plates', 
                plate_list: get_plate_list_from_seed(MersenneTwister19937.seed(seed), req.body.amount, req.session.plnationality),
                timer: req.session.plduration,
                seed:seed,
                size:req.body.amount,
                base: req.body.base,
                verifUrl: "/game/plates/verify",
                amount: req.session.plamount,
                user:req.user
            });
      }
  }
];

/** Perform correction after user's recall validation */
exports.plate_verify = function(req, res) {
  var err=""
  
  if(! req.session.plamount || ! req.session.plseed || ! req.session.plsize) {
      err="Play a game before verifying";
      res.render('plates_verify',{
        title:'Validate your recall',
        err:err, 
        user:req.user
    });
    } else {
      var recall;
      var nList = [];
      var score = 0;
      var lg=[];

      var correct = get_plate_list_from_seed(MersenneTwister19937.seed(req.session.plseed), req.session.plamount, req.session.plnationality)

      for(var i=0;i<req.session.plamount;i++) {
        var ok = true;
        
        if(undefined!=req.body[i] && (''+req.body[i]).split(" ")!=[]){
          var s = (''+req.body[i]).replace(/\s/g, "");
          nList.push(s);
          recall = true;
          if(s==correct[i])
              score++;
          else
              ok=false;
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
                Game.findOne({gid: req.session.wgid}).exec(function(err, ga){
                    if(! err && ! ga){
                        user.findOneAndUpdate({_id: u._id}, { $inc:
                          {xp: score/3}
                        }, function(err, affected, resp) {
                          return console.log(resp);
                        })
                        var g = new Game({
                            user: u._id,
                            gid: req.session.plgid,
                            type: 'Plates',
                            score: score,
                            maxscore: req.session.plamount,
                            seed: req.session.plseed,
                            date: Date.now(),
                            add: req.session.plnationality,
                            duration: req.session.plduration
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
      
      res.render('plates_verify',{
          row:req.session.row,
          base: req.session.base,
          seed:req.session.plseed,
          size: req.session.plsize,
          amount: req.session.plamount,
          recall: recall,
          lg: lg,
          score: score,
          nList: nList,
          score: score,
          correct: get_plate_list_from_seed(MersenneTwister19937.seed(req.session.plseed), req.session.plamount, req.session.plnationality),
          err:err, 
          user:req.user,
          xp: score/3});
  }
}

/** fetch random words from dictionnary to memorize from a seed */
function get_plate_list_from_seed(seed, nLine, language) {
  const random = new Random(seed);
  
  var nList = []
  for(var i=0; i<nLine; i++){
      var p = "";
      p+=String.fromCharCode(65 + random.integer(0,25));
      p+=String.fromCharCode(65 + random.integer(0,25))+"-";
      p+=pad_with_zeroes(random.integer(0,999), 3)+"-";
      p+=String.fromCharCode(65 + random.integer(0,25));
      p+=String.fromCharCode(65 + random.integer(0,25));
      
      nList.push(p);
  }
  return nList;
}


// https://stackoverflow.com/questions/4726040/javascript-adding-zeros-to-the-beginning-of-a-string-max-length-4-chars
function pad_with_zeroes(number, length) {
  var my_string = '' + number;
  while (my_string.length < length) {
      my_string = '0' + my_string;
  }
  return my_string;
}

