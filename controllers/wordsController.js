const validator = require('express-validator');
var async = require('async');
var crypto = require('crypto');

// rng using seed (not available with math.random)
const { Random, MersenneTwister19937 } = require("random-js");

// create a random 32bit int (https://stackoverflow.com/questions/28061016/generate-random-32-bit-number-in-node)
function randU32Sync() {
  return crypto.randomBytes(4).readUInt32BE(0, true);
}

/** form for creating a word game */
exports.word_create_get = function(req, res) {
  res.render('words_form', {title: 'Start a Word Game'});
};


// when user submits the form to create a game
exports.word_create_post = [
  // parse parameters
  validator.body('amount', 'Amount of words required').trim().isLength({min: 1}),
  validator.body('amount', 'Amount must be a number between 1 and 1000').isInt({min:1, max:1000}),
  validator.sanitizeBody('amount').escape(),

  validator.body('group_by', 'Group_by must be a number between 1 and 10').isInt({min:1, max:10}),
  validator.sanitizeBody('group_by').escape(),

  validator.body('duration', 'Duration must be a number between 1 and 180').isInt({min:1, max:180}),
  validator.sanitizeBody('duration').escape(),

  validator.sanitizeBody('seed').escape(),

  // create the game or show errors
  (req, res, next) => {
      const err = validator.validationResult(req);

      if(! err.isEmpty()) {
          res.render('numbers_form', {
              title:'Start a Word Game',
              errors: err.array()
          })
          return;
      }else {
          var seed;

          // create random seed if not provided
          if(req.body.seed)
              seed = req.body.seed;
          else
              seed = randU32Sync();
          
          res.render('word_play', {
              title: 'Play Words', 
              word_list: get_word_list_from_seed(MersenneTwister19937.seed(seed), req.body.amount, req.body.group_by),
              timer: req.body.duration*60,
              seed:seed,
              size:req.body.amount*req.body.group_by,
              row:req.body.group_by,
              base: req.body.base,
              verifUrl: "/game/words/verify"
          });
      }
  }
];

/** Perform correction after user's recall validation */
exports.word_verify = function(req, res) {
  var err=""
  
  if(! req.body.seed || ! req.body.size)
      err="Play a game before verifying";
  else {      
      res.render('words_verify',{
          title:'Validate your recall',
          row:req.body.row,
          base: req.body.base,
          seed:req.body.seed,
          size: req.body.size,
          recall: req.body.recall,
          correct: get_word_list_from_seed(MersenneTwister19937.seed(req.body.seed), req.body.size, 1),
          err:err});
  }
}

/** fetch random words from dictionnary to memorize from a seed */
function get_word_list_from_seed(seed, nLine, lSize) {
  const random = new Random(seed);

  // https://stackoverflow.com/questions/6831918/node-js-read-a-text-file-into-an-array-each-line-an-item-in-the-array
  var fs = require('fs');
  var array = fs.readFileSync('ressources/google-10000-english-usa.txt').toString().split("\n");
  
  var nList = []
  for(var i=0; i<nLine; i++){
      nList.push([]);
      for(var j=0;j<lSize;j++) {
          nList[i].push(array[random.integer(0,array.length)]);
      }
  }
  return nList;
}