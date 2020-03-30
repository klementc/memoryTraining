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
    validator.body('amount', 'Amount must be a number between 1 and 1000').isInt({min:1, max:1000}),
    validator.sanitizeBody('amount').escape(),

    validator.body('group_by', 'Group_by must be a number between 1 and 50').isInt({min:1, max:50}),
    validator.sanitizeBody('group_by').escape(),

    validator.body('duration', 'Duration must be a number between 1 and 180').isInt({min:0, max:180}),
    validator.sanitizeBody('duration').escape(),

    validator.sanitizeBody('seed').escape(),

    validator.sanitizeBody('base').escape(),

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
            
            // add data to session
            req.session.seed = seed;
            req.session.amount = req.body.amount;
            req.session.group_by = req.body.group_by;
            req.session.base = req.body.base;
            
            res.render('number_play', {
                title: 'Play Words', 
                number_list: get_number_list_from_seed(MersenneTwister19937.seed(seed), req.body.amount, req.body.group_by, req.body.base=="binary"),
                timer: req.body.duration*60,
                seed:seed,
                size:req.body.amount*req.body.group_by,
                row:req.body.group_by,
                base: req.body.base,
                verifUrl: "/game/numbers/verify"
            });
        }
    }
];

/** Perform correction after user's recall validation */
exports.number_verify = function(req, res) {
    var err=""
    
    if(! req.session.seed || ! req.session.amount || ! req.session.group_by || ! req.session.base) {
        err="Play a game before verifying";
        res.render('numbers_verify',{
            title:'Validate your recall',
            err:err});
    } else {
        res.render('numbers_verify',{
            title:'Validate your recall',
            row:req.session.amount,
            base: req.session.base,
            seed: req.session.seed,
            size: req.session.amount*req.session.group_by,
            recall: req.body.recall,
            correct: get_number_list_from_seed(MersenneTwister19937.seed(req.session.seed), req.session.amount*req.session.group_by, 1, req.session.base=="binary"),
            err:err});
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