const validator = require('express-validator');
var async = require('async');
var crypto = require('crypto');

exports.pi_create_get = function(req, res) {
  res.render('pi_form', {title: 'Start a PI Game'});
};

exports.pi_create_post = [
  // parse parameters
  validator.body('from', 'From must be an').isNumeric(),
  validator.sanitizeBody('from').escape(),

  validator.body('nbLines', 'Line number must be a number').isNumeric(),
  validator.sanitizeBody('nbLines').escape(),

  validator.body('group_by', 'Group_by must be a number').isNumeric(),
  validator.sanitizeBody('group_by').escape(),

  validator.sanitizeBody('task').escape(),

  // create the game or show errors
  (req, res, next) => {
    const err = validator.validationResult(req);

        // start recall task
    if(req.body.task == "recall") {
      var numList = get_decimals(req.body.from, req.body.nbLines*req.body.group_by);
      console.log(numList);
      // render page showing the requested digits of pi 

      res.render('pi_recall',{
        title:'Showing decimals of pi',
        size: req.body.nbLines*req.body.group_by,
        recall: req.body.recall,
        task: req.body.task,
        numList: numList
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
            title:'Start a PI Game',
            errors: err.array()
        })
        return;
    }else {
      // start learn task
      if(req.body.task=="learn") {
        var numList = get_decimals(req.body.from, req.body.nbLines*req.body.group_by);
        console.log(numList);
        // render page showing the requested digits of pi 
        res.render('pi_show',{
          title:'Showing decimals of pi',
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
function get_decimals(start,len) {
  // https://stackoverflow.com/questions/6831918/node-js-read-a-text-file-into-an-array-each-line-an-item-in-the-array
  var fs = require('fs');
  var array = fs.readFileSync('ressources/PI50K_DP.TXT').toString().trim();
  //console.log(array);

  return array.substr(start, len);
}