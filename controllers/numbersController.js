const validator = require('express-validator');
var async = require('async');
var crypto = require('crypto');

// rng using seed (not available with math.random)
const { Random, MersenneTwister19937 } = require("random-js");


/** form for creating a number game */
exports.number_create_get = function(req, res) {
    res.render('numbers_form', {title: 'Start a Number Game'});
};

// when user submits the form to create a game
exports.number_create_post = [
    // parse parameters
    validator.body('amount', 'Amount of number required').trim().isLength({min: 1}),
    validator.body('amount', 'Amount must be a number').isNumeric(),
    validator.sanitizeBody('amount').escape(),

    validator.body('group_by', 'Group_by must be a number').isNumeric(),
    validator.sanitizeBody('group_by').escape(),

    validator.body('duration', 'Duration must be a number').isNumeric(),
    validator.sanitizeBody('duration').escape(),

    validator.sanitizeBody('seed').escape(),

    // create the game or show errors
    (req, res, next) => {
        const err = validator.validationResult(req);

        if(! err.isEmpty()) {
            res.render('numbers_form', {
                title:'Start a Number Game',
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

            res.render('number_play', {
                title: 'Play Numbers', 
                number_list: get_number_list_from_seed(MersenneTwister19937.seed(seed), req.body.amount, req.body.group_by),
                timer: req.body.duration*60,
                seed:seed,
                size:req.body.amount*req.body.group_by,
                row:req.body.group_by
            });
        }
    }
];

/** Perform correction after user's recall validation */
exports.number_verify = function(req, res) {
    var err=""
    
    if(! req.body.seed || ! req.body.size)
        err="Play a game before verifying";
    else {
        res.render('numbers_verify',{
            title:'Validate your recall',
            row:req.body.row,
            seed:req.body.seed,
            size: req.body.size,
            recall: req.body.recall,
            correct: get_number_list_from_seed(MersenneTwister19937.seed(req.body.seed), req.body.size, 1),
            err:err});
    }
}

/** create random numbers to memorize from a seed */
function get_number_list_from_seed(seed, nLine, lSize) {
    const random = new Random(seed);
    var nList = []
    for(var i=0; i<nLine; i++){
        nList.push([]);
        for(var j=0;j<lSize;j++) {
            nList[i].push(random.integer(0,9));
        }
    }
    return nList;
}

// create a random 32bit int (https://stackoverflow.com/questions/28061016/generate-random-32-bit-number-in-node)
function randU32Sync() {
  return crypto.randomBytes(4).readUInt32BE(0, true);
}