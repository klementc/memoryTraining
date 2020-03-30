const validator = require('express-validator');
var async = require('async');
var crypto = require('crypto');

exports.pi_create_get = function(req, res) {
  res.render('pi_form', {title: 'Famous numbers memorization'});
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
          errors: err.array()
      })
      return;
      }if(req.body.task == "recall") {
      var numList = get_decimals(req.body.from, req.body.nbLines*req.body.group_by, getfname(req.body.number));

      // session data
      req.session.pifrom = req.body.from;
      req.session.pinbLines = req.body.nbLines;
      req.session.pigroup_by = req.body.group_by;
      req.session.pinumber = req.body.number;
      req.session.pisize = req.body.group_by*req.body.nbLines;

      res.render('pi_recall',{
        title:'Showing decimals of number',
        size: req.body.nbLines*req.body.group_by,
        recall: req.body.recall,
        numList: numList,
        number: req.body.number,
      });
    } else {
      // start learn task
      if(req.body.task=="learn") {

        var numList = get_decimals(req.body.from, req.body.nbLines*req.body.group_by, getfname(req.body.number));

        // session data
        req.session.pifrom = req.body.from;
        req.session.pinbLines = req.body.nbLines;
        req.session.pigroup_by = req.body.group_by;
        req.session.pinumber = req.body.number;
        req.session.pisize = req.body.group_by*req.body.nbLines;

        //console.log(numList);
        // render page showing the requested digits of pi 
        res.render('pi_show',{
          title:'Showing decimals of number',
          from: req.body.from,
          size: req.session.pisize,
          nbLines: req.body.nbLines,
          group_by: req.body.group_by,
          numList: numList
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
        err:err
    });
  } else{
    res.render('pi_recall',{
      title:'Validate your recall',
      size: req.session.pisize,
      number: req.session.pinumber,
      numList:  get_decimals(req.session.pifrom, req.session.pisize, getfname(req.session.pinumber)),
      recall: req.body.recall,
      number: req.session.pinumber
    });
  }
}

/** fetch decimals from file to memorize*/
function get_decimals(start,len, file) {
  // https://stackoverflow.com/questions/6831918/node-js-read-a-text-file-into-an-array-each-line-an-item-in-the-array
  var fs = require('fs');
  var array = fs.readFileSync(file).toString().trim();
  //console.log(array);

  return array.substr(start, len);
}

function getfname(num) {
  var fname;
  if(num == "pi") fname='ressources/PI50K_DP.TXT';
  else if(num == "phi") fname='ressources/phi_50k.txt'; 
  else fname='ressources/sq2.txt'; 

  return fname
}