const validator = require('express-validator');
var async = require('async');
var crypto = require('crypto');
var user = require('../models/user');
var Game = require('../models/game');
const { uuid } = require('uuidv4');

// rng using seed (not available with math.random)
const { Random, MersenneTwister19937 } = require("random-js");

// create a random 32bit int (https://stackoverflow.com/questions/28061016/generate-random-32-bit-number-in-node)
function randU32Sync() {
  return crypto.randomBytes(4).readUInt32BE(0, true);
}

/** form for creating a word game */
exports.flash_create_get = function(req, res) {
  res.render('flash_words_form', {title: 'Flash Word Game', user:req.user});
};


// when user submits the form to create a game
exports.flash_create_post = [
  // parse parameters
  validator.body('amount', 'Amount of words required').trim().isLength({min: 1}),
  validator.body('amount', 'Amount must be a number between 1 and 1000').isInt({min:1, max:1000}),
  validator.sanitizeBody('amount').escape(),

  validator.body('duration', 'Duration must be a number between 1 and 10').isInt({min:1, max:10}),
  validator.sanitizeBody('duration').escape(),

  validator.body('language','Please select a valid language').isIn(['en-us','fr']),
  validator.sanitizeBody('language').escape(),
  
  validator.sanitizeBody('seed').escape(),


  (req, res, next) => {
    const err = validator.validationResult(req);

    if(! err.isEmpty()) {
        res.render('flash_words_form', {
            title:'Start a decimal recall Game',
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
        req.session.fwgid = uuid();
        req.session.fwseed = seed;
        req.session.fwamount = req.body.amount;
        req.session.fwlanguage = req.body.language;
        req.session.fwduration = req.body.duration;

        res.render('flash_words_play', {
            title: 'Play Flash Words', 
            duration: req.body.duration,
            seed:seed,
            size:req.body.amount,
            word_list: get_word_list_from_seed(MersenneTwister19937.seed(seed), req.body.amount, 1, req.session.fwlanguage), 
            user:req.user
        });
    }
  }
];

/** Perform correction after user's recall validation */
exports.flash_verify = function(req, res) {
  var err=""
  
  if(! req.session.fwseed || ! req.session.fwamount) {
      err="Play a game before verifying";
      res.render('flash_words_recall',{
        title:'Validate your recall',
        err:err, 
        user:req.user
    });
  } else {      
    var recall;
    var nList = [];
    var score = 0;
    var lg=[];

    var correct = get_word_list_from_seed(MersenneTwister19937.seed(req.session.fwseed), req.session.fwamount, 1, req.session.fwlanguage)

    for(var i=0;i<req.session.fwamount;i++) {
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
              Game.findOne({gid: req.session.fwgid}).exec(function(err, ga){
                  if(! err && ! ga){
                      user.findOneAndUpdate({_id: u._id}, { $inc:
                        {xp: score/2}
                      }, function(err, affected, resp) {
                        return console.log(resp);
                      })

                      var g = new Game({
                          user: u._id,
                          gid: req.session.fwgid,
                          type: "Flashwords",
                          score: score,
                          maxscore: req.session.fwamount,
                          seed: req.session.fwseed,
                          date: Date.now(),
                          add: req.session.fwlanguage,
                          duration: req.session.fwduration*req.session.fwamount
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

    res.render('flash_words_recall', {
        score: score,
        lg: lg,
        nList: nList,
        correct: get_word_list_from_seed(MersenneTwister19937.seed(req.session.fwseed), req.session.fwamount,1, req.session.fwlanguage),
        seed:req.session.fwseed,
        group_by: 1,
        amount: req.session.fwamount,
        recall: recall, 
        user:req.user,
        xp: score/2,
        size: req.session.fwamount
    });
  }
}


/** fetch random words from dictionnary to memorize from a seed */
function get_word_list_from_seed(seed, nLine, lSize, language) {
  const random = new Random(seed);

  var lf = 'ressources/google-10000-english-usa.txt';
  if(language=='fr') lf = 'ressources/francais.txt';

  // https://stackoverflow.com/questions/6831918/node-js-read-a-text-file-into-an-array-each-line-an-item-in-the-array
  var fs = require('fs');
  var array = fs.readFileSync(lf).toString().trim().split(/\r?\n/);
  
  var nList = []
  for(var i=0; i<nLine; i++){
      nList.push([]);
      for(var j=0;j<lSize;j++) {
          nList[i].push(array[random.integer(0,array.length)]);
      }
  }
  return nList;
}