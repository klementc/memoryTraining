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
exports.date_create_get = function(req, res) {
  res.render('date_form', {title: 'Start a Date Game', user:req.user});
};


// when user submits the form to create a game
exports.date_create_post = [
  // parse parameters
  validator.body('amount', 'Amount of words required').trim().isLength({min: 1}),
  validator.body('amount', 'Amount must be a number between 1 and 1000').isInt({min:1, max:1000}),
  validator.sanitizeBody('amount').escape(),

  validator.body('durationm', 'Duration (min) must be a number between 0 and 180').isInt({min:0, max:180}),
  validator.sanitizeBody('durationm').escape(),

  validator.body('durations', 'Duration (s) must be a number between 0 and 59').isInt({min:0, max:59}),
  validator.sanitizeBody('durations').escape(),

  validator.sanitizeBody('seed').escape(),

  // create the game or show errors
  (req, res, next) => {
      const err = validator.validationResult(req);

      if(! err.isEmpty()) {
          res.render('date_form', {
              title:'Start a Date Game',
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
            req.session.dgid = uuid();
            req.session.damount = req.body.amount;
            req.session.dseed = seed;
            req.session.dduration = (Number(req.body.durationm)*60)+Number(req.body.durations);
            console.log(get_date_list_from_seed(MersenneTwister19937.seed(seed), req.body.amount, 1))
            // render game page
            res.render('date_play', {
                title: 'Play Dates', 
                date_list: get_date_list_from_seed(MersenneTwister19937.seed(seed), req.body.amount, 1),
                timer: req.session.dduration,
                seed:seed,
                size:req.body.amount,
                row:req.body.group_by,
                base: req.body.base,
                verifUrl: "/game/date/verify",
                amount: req.session.damount,
                group_by: req.session.dgroup_by, 
                user:req.user
            });
      }
  }
];

/** Perform correction after user's recall validation */
exports.date_verify = function(req, res) {
  var err=""
  
  if(! req.session.damount ||  ! req.session.dseed ) {
      err="Play a Date game before verifying";
      res.render('date_verify',{
        title:'Validate your recall',
        err:err, 
        user:req.user
    });
    } else {
      var recall;
      var nList = [];
      var score = 0;
      var lg=[];

      var correct = get_date_list_from_seed(MersenneTwister19937.seed(req.session.dseed), req.session.damount, 1)

      for(var i=0;i<req.session.damount;i++) {
        var ok = true;
        
          if(undefined!=req.body[i] && (''+req.body[i]).trim()!=[]){
              var s = (''+req.body[i]).trim()
              console.log(req.body[i]+" : "+correct[i][0][0]+" : "+s)
              nList.push(s);
              recall = true;
              if(s==correct[i][0][0])
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
                          {xp: score/5}
                        }, function(err, affected, resp) {
                          return console.log(resp);
                        })
                        var g = new Game({
                            user: u._id,
                            gid: req.session.dgid,
                            type: 'Dates',
                            score: score,
                            maxscore: req.session.damount,
                            seed: req.session.dseed,
                            date: Date.now(),
                            duration: req.session.dduration
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
      
      res.render('date_verify',{
          title:'Correction of your recall',
          row:req.session.row,
          base: req.session.base,
          seed:req.session.dseed,
          size: req.session.dsize,
          amount: req.session.damount,
          recall: recall,
          lg: lg,
          score: score,
          nList: nList,
          score: score,
          correct: get_date_list_from_seed(MersenneTwister19937.seed(req.session.dseed), req.session.damount, 1),
          err:err, 
          user:req.user});
  }
}

/** fetch random dates from dictionnary to memorize from a seed */
function get_date_list_from_seed(seed, nLine, lSize) {
  const random = new Random(seed);

  var lf = 'ressources/dates.txt';

  // https://stackoverflow.com/questions/6831918/node-js-read-a-text-file-into-an-array-each-line-an-item-in-the-array
  var fs = require('fs');
  var array = fs.readFileSync(lf).toString().trim().split(/\r?\n/);
  
  var nList = []
  for(var i=0; i<nLine; i++){
      nList.push([]);
      for(var j=0;j<lSize;j++) {
          nList[i].push((""+array[random.integer(0,array.length)]).split(" : "));
      }
  }
  return nList;
}