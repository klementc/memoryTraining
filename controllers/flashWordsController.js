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
exports.flash_create_get = function(req, res) {
  res.render('flash_words_form', {title: 'Flash Word Game'});
};


// when user submits the form to create a game
exports.flash_create_post = [
  // parse parameters
  validator.body('amount', 'Amount of words required').trim().isLength({min: 1}),
  validator.body('amount', 'Amount must be a number between 1 and 1000').isInt({min:1, max:1000}),
  validator.sanitizeBody('amount').escape(),

  validator.body('duration', 'Duration must be a number between 1 and 10').isInt({min:1, max:10}),
  validator.sanitizeBody('duration').escape(),

  validator.sanitizeBody('seed').escape(),


  (req, res, next) => {
    const err = validator.validationResult(req);

    if(! err.isEmpty() && req.body.task!='recall' && req.body.task != 'corr') {
        res.render('flash_words_form', {
            title:'Start a decimal recall Game',
            errors: err.array()
        })
        return;
    }
    // perform correction after user's recall
    else if(req.body.task == "corr") {
      console.log("corr "+req.body.seed);
      res.render('flash_words_recall',{
        size: req.body.size,
        task: req.body.task,
        recall: req.body.recall,
        seed: req.body.seed,
        word_list: get_word_list_from_seed(MersenneTwister19937.seed(req.body.seed), req.body.size,1)
      });
    }
    // start recall task
    else if(req.body.task == "recall") {
        console.log("recall"+req.body.seed+" "+req.body.size);
        res.render('flash_words_recall', {
            word_list: get_word_list_from_seed(MersenneTwister19937.seed(req.body.seed), req.body.size,1),
            seed:req.body.seed,
            size:req.body.size
        });
        }
    else if(req.body.task=="play"){
        // start learn task
        var seed
        // create random seed if not provided
        if(req.body.seed)
            seed = req.body.seed;
        else
            seed = randU32Sync();
        
        res.render('flash_words_play', {
            title: 'Play Flash Words', 
            duration: req.body.duration,
            seed:seed,
            size:req.body.amount,
            row:req.body.group_by,
            base: req.body.base,
            word_list: get_word_list_from_seed(MersenneTwister19937.seed(seed), req.body.amount, 1)
        });
    }
  }
];

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