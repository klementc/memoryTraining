const validator = require('express-validator');
var async = require('async');
var crypto = require('crypto');
const { uuid } = require('uuidv4');

// rng using seed (not available with math.random)
const { Random, MersenneTwister19937 } = require("random-js");

// create a random 32bit int (https://stackoverflow.com/questions/28061016/generate-random-32-bit-number-in-node)
function randU32Sync() {
  return crypto.randomBytes(4).readUInt32BE(0, true);
}


/** form for creating a word game */
exports.day_create_get = function(req, res) {
  res.render('weekday_form', {title: 'Start a Date Game', user:req.user});
};


// when user submits the form to create a game
exports.day_create_post = [
  // parse parameters
  validator.body('amount', 'Amount of words required').trim().isLength({min: 1}),
  validator.body('amount', 'Amount must be a number between 1 and 1000').isInt({min:1, max:1000}),
  validator.sanitizeBody('amount').escape(),

  validator.sanitizeBody('seed').escape(),

  // create the game or show errors
  (req, res, next) => {
      const err = validator.validationResult(req);

      if(! err.isEmpty()) {
          res.render('weekday_form', {
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
            req.session.wdgid = uuid();
            req.session.wdamount = req.body.amount;
            req.session.wdseed = seed;

            // render game page 
            res.render('weekday_play', {
                title: 'Play Dates', 
                date_list: genDates(MersenneTwister19937.seed(seed), req.body.amount),
                seed:seed,
                size:req.body.amount,
                row:req.body.group_by,
                base: req.body.base,
                amount: req.session.damount,
                group_by: req.session.dgroup_by, 
                user:req.user
            });
      }
  }
];

/** Perform correction after user's recall validation */
exports.day_verify = function(req, res) {
  var err=""
  
  if(! req.session.wdamount ||  ! req.session.wdseed ) {
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

      var dates = genDates(MersenneTwister19937.seed(req.session.wdseed), req.session.wdamount);
      var correct = []

      for(var i=0;i<req.session.wdamount;i++) {
        var ok = true;
        console.log("a:"+req.body[i]);
          correct.push(getDayOfDate(dates[i][0],dates[i][1],dates[i][2]))
          if(undefined!=req.body[i] && (''+req.body[i]).trim()!=[]){
              var s = (''+req.body[i]).trim()
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
      console.log(correct);

      
      res.render('weekday_verify',{
          title:'Correction of your recall',
          seed:req.session.wdseed,
          amount: req.session.wdamount,
          recall: recall,
          lg: lg,
          score: score,
          nList: nList,
          score: score,
          dates:dates,
          correct: correct,
          err:err, 
          user:req.user});
  }
}

/** ONLY WORKS FOR GREGORIAN DATES */

const monthCode = [0,3,3,6,1,4,6,2,5,0,3,5];
const centCode = [6,4,2,0];
const dayR = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

function isLeap(year) {
  return (year % 4 == 0) && (!(year%100==0) || (year%400==0))
}

function getDayOfDate(day,month,year) {
  var num  = year % 100;
  num = num+(Math.floor(num/4))
  num += day;
  num += monthCode[month-1]
  var century = Math.floor(year/100)%4;
  num += centCode[century];
  var l = isLeap(year);
  if((l && month==1) || (l && month==2)) num--;
  
  return dayR[num%7]
}

function genDates(seed, amount) {
  const random = new Random(seed);
  var dList = [];
  for(var i=0; i<amount; i++) {
    dList.push([random.integer(1,28),random.integer(1,12),random.integer(1600, 2500)]);
  }
  return dList;
}