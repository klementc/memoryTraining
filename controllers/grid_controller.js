const validator = require('express-validator');
var async = require('async');

exports.grid_create_post = [
  // parse parameters

  validator.body('width', 'Width must be a grid between 1 and 15').isInt({min:1, max:15}),
  validator.sanitizeBody('width').escape(),

  validator.body('height', 'Height must be a grid between 1 and 15').isInt({min:1, max:15}),

  validator.body('duration', 'Duration must be a grid between 1 and 1800').isInt({min:1, max:180}),
  validator.sanitizeBody('duration').escape(),

  // create the game or show errors
  (req, res, next) => {
      const err = validator.validationResult(req);

      if(! err.isEmpty()) {
          res.render('grids_form', {
              title:'Start a grid Game',
              errors: err.array()
          })
          return;
      }else {
          res.render('grid_play', {
            width: req.body.width,
            height: req.body.height,
            duration: req.body.duration
          });
      }
  }
];