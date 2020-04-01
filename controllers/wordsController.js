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
exports.word_create_get = function(req, res) {
  res.render('words_form', {title: 'Start a Word Game', user:req.user});
};


// when user submits the form to create a game
exports.word_create_post = [
  // parse parameters
  validator.body('amount', 'Amount of words required').trim().isLength({min: 1}),
  validator.body('amount', 'Amount must be a number between 1 and 1000').isInt({min:1, max:1000}),
  validator.sanitizeBody('amount').escape(),

  validator.body('group_by', 'Group_by must be a number between 1 and 10').isInt({min:1, max:10}),
  validator.sanitizeBody('group_by').escape(),

  validator.body('duration', 'Duration must be a number between 1 and 180').isInt({min:0, max:180}),
  validator.sanitizeBody('duration').escape(),

  validator.body('language','Please select a valid language').isIn(['en-us','fr']),
  validator.sanitizeBody('language').escape(),

  validator.sanitizeBody('seed').escape(),

  // create the game or show errors
  (req, res, next) => {
      const err = validator.validationResult(req);

      if(! err.isEmpty()) {
          res.render('numbers_form', {
              title:'Start a Word Game',
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
            req.session.wgid = uuid();
            req.session.wamount = req.body.amount;
            req.session.wgroup_by = req.body.group_by;
            req.session.wseed = seed;
            req.session.wsize = req.body.amount*req.body.group_by;
            req.session.wlanguage = req.body.language;
            
            // render game page
            res.render('word_play', {
                title: 'Play Words', 
                word_list: get_word_list_from_seed(MersenneTwister19937.seed(seed), req.body.amount, req.body.group_by, req.session.wlanguage),
                timer: req.body.duration*60,
                seed:seed,
                size:req.body.amount*req.body.group_by,
                row:req.body.group_by,
                base: req.body.base,
                verifUrl: "/game/words/verify",
                amount: req.session.wamount,
                group_by: req.session.wgroup_by, 
                user:req.user
            });
      }
  }
];

/** Perform correction after user's recall validation */
exports.word_verify = function(req, res) {
  var err=""
  
  if(! req.session.wamount || ! req.session.wgroup_by || ! req.session.wseed || ! req.session.wsize) {
      err="Play a game before verifying";
      res.render('words_verify',{
        title:'Validate your recall',
        err:err, 
        user:req.user
    });
    } else {
      var recall;
      var nList = [];
      var score = 0;
      var lg=[];

      var correct = get_word_list_from_seed(MersenneTwister19937.seed(req.session.wseed), req.session.wamount, req.session.wgroup_by, req.session.wlanguage)

      for(var i=0;i<req.session.wamount;i++) {
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
                Game.findOne({gid: req.session.wgid}).exec(function(err, ga){
                    if(! err && ! ga){
                        var g = new Game({
                            user: u._id,
                            gid: req.session.wgid,
                            type: 'Words',
                            score: score,
                            maxscore: req.session.wamount*req.session.wgroup_by,
                            seed: req.session.wseed,
                            date: Date.now()
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
      
      res.render('words_verify',{
          title:'Validate your recall',
          row:req.session.row,
          base: req.session.base,
          seed:req.session.wseed,
          size: req.session.wsize,
          group_by: req.session.wgroup_by,
          amount: req.session.wamount,
          recall: recall,
          lg: lg,
          score: score,
          nList: nList,
          score: score,
          correct: get_word_list_from_seed(MersenneTwister19937.seed(req.session.wseed), req.session.wamount, req.session.wgroup_by, req.session.wlanguage),
          err:err, 
          user:req.user});
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