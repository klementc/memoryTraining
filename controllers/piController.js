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
    if(req.body.task == "recall") {
      // pi by default
      var fname='ressources/PI50K_DP.TXT'
      if(req.body.number == "pi") fname='ressources/PI50K_DP.TXT';
      else if(req.body.number == "phi") fname='ressources/phi_50k.txt'; 
      else if(req.body.number == "sq2") fname='ressources/sq2.txt'; 
      console.log(fname)
      var numList = get_decimals(req.body.from, req.body.nbLines*req.body.group_by, fname);
      // render page showing the requested digits of pi 

      res.render('pi_recall',{
        title:'Showing decimals of number',
        size: req.body.nbLines*req.body.group_by,
        recall: req.body.recall,
        task: req.body.task,
        numList: numList,
        number: req.body.number
      });
    }
    // perform correction after user's recall
    else if(req.body.task == "corr") {
      res.render('pi_recall',{
        title:'Validate your recall',
        size: req.body.size,
        task: req.body.task,
        numList: req.body.numList,
        recall: req.body.recall
      });
    }
    else if(! err.isEmpty()) {
        res.render('pi_form', {
            title:'Start a decimal recall Game',
            errors: err.array()
        })
        return;
    }else {
      // start learn task
      if(req.body.task=="learn") {
        var fname='ressources/PI50K_DP.TXT'
        if(req.body.number == "pi") fname='ressources/PI50K_DP.TXT';
        else if(req.body.number == "phi") fname='ressources/phi_50k.txt'; 
        else if(req.body.number == "sq2") fname='ressources/sq2.txt'; 
        console.log(fname)
        var numList = get_decimals(req.body.from, req.body.nbLines*req.body.group_by, fname);
        //console.log(numList);
        // render page showing the requested digits of pi 
        res.render('pi_show',{
          title:'Showing decimals of number',
          from: req.body.from,
          nbLines: req.body.nbLines,
          group_by: req.body.group_by,
          task: req.body.task,
          numList: numList
        });
      }
    }
  }
]


/** fetch decimals from file to memorize*/
function get_decimals(start,len, file) {
  // https://stackoverflow.com/questions/6831918/node-js-read-a-text-file-into-an-array-each-line-an-item-in-the-array
  var fs = require('fs');
  var array = fs.readFileSync(file).toString().trim();
  //console.log(array);

  return array.substr(start, len);
}