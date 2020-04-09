const validator = require('express-validator');
var async = require('async');
var crypto = require('crypto');
const { uuid } = require('uuidv4');
var user = require('../models/user');
var Game = require('../models/game');

// rng using seed (not available with math.random)
const { Random, MersenneTwister19937 } = require("random-js");


/** form for creating a number game */
exports.number_create_get = function(req, res) {
    res.render('numbers_form', {title: 'Start a Number Game', user:req.user});
};

// when user submits the form to create a game
exports.number_create_post = [
    // parse parameters
    validator.body('amount', 'Amount of number required').trim().isLength({min: 1}),
    validator.body('amount', 'Amount must be a number between 1 and 1000').isInt({min:1, max:1000}),
    validator.sanitizeBody('amount').escape(),

    validator.body('group_by', 'Group_by must be a number between 1 and 50').isInt({min:1, max:50}),
    validator.sanitizeBody('group_by').escape(),

    validator.body('durationm', 'Minutes must be a number between 1 and 180').isInt({min:0, max:180}),
    validator.sanitizeBody('durationm').escape(),

    validator.body('durations', 'Seconds must be a number between 1 and 59').isInt({min:0, max:59}),
    validator.sanitizeBody('durations').escape(),

    validator.sanitizeBody('seed').escape(),

    validator.body('base','Base must be either Binary or Decimal').isIn(['decimal', 'binary']),
    validator.sanitizeBody('base').escape(),

    // create the game or show errors
    (req, res, next) => {
        const err = validator.validationResult(req);

        if(! err.isEmpty()) {
            res.render('numbers_form', {
                title:'Start a Number Game',
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
            
            // add data to session
            req.session.ngid = uuid();
            req.session.nseed = seed;
            req.session.namount = req.body.amount;
            req.session.ngroup_by = req.body.group_by;
            req.session.nbase = req.body.base;
            req.session.nduration = (Number(req.body.durationm)*60)+Number(req.body.durations);
            
            res.render('number_play', {
                title: 'Play Words', 
                amount: req.body.amount,
                group_by: req.body.group_by,
                number_list: get_number_list_from_seed(MersenneTwister19937.seed(seed), req.body.amount, req.body.group_by, req.body.base=="binary"),
                timer: (Number(req.body.durationm)*60)+Number(req.body.durations),
                seed:seed,
                size:req.body.amount*req.body.group_by,
                row:req.body.group_by,
                base: req.body.base,
                verifUrl: "/game/numbers/verify", 
                user:req.user
            });
        }
    }
];

/** Perform correction after user's recall validation */
exports.number_verify = function(req, res) {
    var err=""
    
    if(! req.session.nseed || ! req.session.namount || ! req.session.ngroup_by || ! req.session.nbase) {
        err="Play a game before verifying";
        res.render('numbers_verify',{
            title:'Validate your recall',
            err:err, 
            user:req.user});
    } else {
        var recall;
        var nList = [];
        var score = 0;
        var lg=[];

        var correct = get_number_list_from_seed(MersenneTwister19937.seed(req.session.nseed), req.session.namount, req.session.ngroup_by, req.session.nbase=="binary");
        for(var i=0;i<req.session.namount;i++) {
            var ok = true;
            if(undefined!=req.body[i] && req.body[i]!=""){
                nList.push(req.body[i]);
                recall = true;
                for(var j=0;j<Math.max(req.body[i].length,req.session.ngroup_by);j++) {
                    if(req.body[i][j]==correct[i][j])
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
                    Game.findOne({gid: req.session.ngid}).exec(function(err, ga){
                        if(! err && ! ga){
                            user.findOneAndUpdate({_id: u._id}, { $inc:
                                {xp: score/10}
                              }, function(err, affected, resp) {
                                return console.log(resp);
                              })
                            var g = new Game({
                                user: u._id,
                                gid: req.session.ngid,
                                type: 'Number',
                                score: score,
                                maxscore: req.session.namount*req.session.ngroup_by,
                                seed: req.session.nseed,
                                date: Date.now(),
                                duration: req.session.nduration  
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

        res.render('numbers_verify',{
            title:'Validate your recall',
            lg: lg,
            row:req.session.namount,
            amount: req.session.namount,
            group_by: req.session.ngroup_by,
            base: req.session.nbase,
            seed: req.session.nseed,
            score: score,
            size: req.session.namount*req.session.ngroup_by,
            nList: nList,
            recall: recall,
            correct: correct,
            err:err, 
            user:req.user});
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