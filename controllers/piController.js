const validator = require('express-validator');
var async = require('async');
var crypto = require('crypto');
const { uuid } = require('uuidv4');
var user = require('../models/user');
var Game = require('../models/game');

exports.pi_create_get = function(req, res) {
  res.render('pi_form', {title: 'Famous numbers memorization', user:req.user});
};

exports.pi_create_post = [
  // parse parameters
  validator.body('from', 'From must be an').isInt({min:0, max:50000}),
  validator.sanitizeBody('from').escape(),

  validator.body('nbLines', 'Line number must be a number between 1 and 500').isInt({min:1, max:500}),
  validator.sanitizeBody('nbLines').escape(),

  validator.body('group_by', 'Group_by must be a number between 1 and 50').isInt({min:1, max:50}),
  validator.sanitizeBody('group_by').escape(),

  validator.sanitizeBody('task').escape(),
  validator.sanitizeBody('number').escape(),

  // create the game or show errors
  (req, res, next) => {
    const err = validator.validationResult(req);

    // start recall task
    if(! err.isEmpty()) {
      res.render('pi_form', {
          title:'Start a Pi Game',
          errors: err.array(), 
          user:req.user
      })
      return;
      }if(req.body.task == "recall") {
      var numList = get_decimals(req.body.from, req.body.nbLines*req.body.group_by, getfname(req.body.number), req.body.group_by);

      // session data
      req.session.pigid = uuid();
      req.session.pifrom = req.body.from;
      req.session.piamount = req.body.nbLines;
      req.session.pigroup_by = req.body.group_by;
      req.session.pinumber = req.body.number;
      req.session.pisize = req.body.group_by*req.body.nbLines;

      res.render('pi_recall',{
        title:'Showing decimals of number',
        size: req.body.nbLines*req.body.group_by,
        recall: req.body.recall,
        numList: numList,
        number: req.body.number,
        from: req.session.pifrom,
        group_by: req.session.pigroup_by,
        amount: req.session.piamount, 
        user:req.user
      });
    } else {
      // start learn task
      if(req.body.task=="learn") {

        var numList = get_decimals(req.body.from, req.body.nbLines*req.body.group_by, getfname(req.body.number),req.body.group_by);

        // session data
        req.session.pifrom = req.body.from;
        req.session.piamount = req.body.nbLines;
        req.session.pigroup_by = req.body.group_by;
        req.session.pinumber = req.body.number;
        req.session.pisize = req.body.group_by*req.body.nbLines;

        //console.log(numList);
        // render page showing the reqed digits of pi 
        res.render('pi_show',{
          title:'Showing decimals of number',
          from: req.body.from,
          size: req.session.pisize,
          nbLines: req.body.nbLines,
          group_by: req.body.group_by,
          group_by: req.session.pigroup_by,
          amount: req.session.piamount,
          numList: numList, 
          user:req.user
        });
      }
    }
  }
]


/** Perform correction after user's recall validation */
exports.pi_verify = function(req, res) {
  var err=""
  //console.log(req.session);
  if(! req.session.pisize || ! req.session.pinumber) {
      err="Play a game before verifying";
      res.render('pi_recall',{
        title:'Validate your recall',
        err:err, 
        user:req.user
    });
  } else{
    var recall;
    var nList = [];
    var score = 0;
    var lg=[];
    var correct = get_decimals(req.session.pifrom, req.session.piamount*req.session.pigroup_by, getfname(req.session.pinumber),req.session.pigroup_by);
    console.log("correct:"+score);

    for(var i=0;i<req.session.piamount;i++) {
      console.log(req.body[i]);
        var ok = true;
        if(undefined!=req.body[i] && req.body[i]!=""){
            nList.push(req.body[i]);
            recall = true;
            for(var j=0;j<Math.max(req.body[i].length,req.session.pigroup_by);j++) {
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
              Game.findOne({gid: req.session.pigid}).exec(function(err, ga){
                  if(! err && ! ga){
                      var g = new Game({
                          user: u._id,
                          gid: req.session.pigid,
                          type: 'PI',
                          score: score,
                          maxscore: req.session.piamount*req.session.pigroup_by,
                          seed: req.session.piseed,
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

    res.render('pi_recall',{
      title:'Validate your recall',
      score: score,
      group_by: req.session.pigroup_by,
      amount: req.session.piamount,
      number: req.session.pinumber,
      recall: recall,
      correct: correct,
      nList: nList,
      number: req.session.pinumber,
      lg: lg, 
      user:req.user
    });
  }
}

/** fetch decimals from file to memorize*/
function get_decimals(start,len, file, gb) {
  // https://stackoverflow.com/questions/6831918/node-js-read-a-text-file-into-an-array-each-line-an-item-in-the-array
  var fs = require('fs');
  var array = fs.readFileSync(file).toString().trim();
  var v = array.substr(start,len);

  return chunkString(array.substr(start, len), gb);
}

function getfname(num) {
  var fname;
  if(num == "pi") fname='ressources/PI50K_DP.TXT';
  else if(num == "phi") fname='ressources/phi_50k.txt'; 
  else fname='ressources/sq2.txt'; 

  return fname;
}
function chunkString(str, length) {
  return str.match(new RegExp('.{1,' + length + '}', 'g'));
}