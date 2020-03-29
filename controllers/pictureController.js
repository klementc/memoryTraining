const validator = require('express-validator');
var async = require('async');

exports.picture_create_post = [
  // parse parameters
  validator.body('duration', 'Duration must be a grid between 1 and 1800').isInt({min:1, max:180}),
  validator.sanitizeBody('duration').escape(),

  validator.body('nbPics', 'nbPics must be a number between 1 and 40').isInt({min:1, max:40}),
  validator.sanitizeBody('nbPics').escape(),
  // create the game or show errors
  (req, res, next) => {
      const err = validator.validationResult(req);

      if(! err.isEmpty()) {
          res.render('picture_form', {
              title:'Start a picture Game',
              errors: err.array()
          })
          return;
      }else {
          console.log("play")
          res.render('picture_play', {
            nbPics: req.body.nbPics,
            duration: req.body.duration
          });
      }
  }
];