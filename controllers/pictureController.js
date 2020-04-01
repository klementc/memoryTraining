const validator = require('express-validator');
var async = require('async');
const { uuid } = require('uuidv4');

var crypto = require('crypto');

// rng using seed (not available with math.random)
const { Random, MersenneTwister19937 } = require("random-js");

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

          //init session data
          req.session.picgid = uuid();
          req.session.picnbpics = req.body.nbPics;
          req.session.picseed = seed;
          req.session.picduration = req.body.duration;

          console.log("play")
          res.render('picture_play', {
            nbPics: req.session.picnbpics,
            picList: get_pics_list_from_seed((MersenneTwister19937.seed(req.session.picseed)), req.session.picnbpics, 150),
            correct: get_pics_list_from_seed((MersenneTwister19937.seed(req.session.picseed+1)), 30,150),
            pos: get_pics_list_from_seed((MersenneTwister19937.seed(req.session.picseed+2)), 2*req.session.picnbpics, 530),
            rot: get_pics_list_from_seed((MersenneTwister19937.seed(req.session.picseed+3)), req.session.picnbpics, 360),
            duration: req.body.duration,
            seed: req.session.picseed, 
            user:req.user
          });
      }
  }
];

/** Perform correction after user's recall validation */
exports.picture_verify = function(req, res) {
  var err=""
  
  if(! req.session.picnbpics || ! req.session.picseed) {
      err="Play a game before verifying";
      res.render('picture_verify',{
          title:'Validate your recall',
          err:err, 
          user:req.user});
  } else {
      res.render('picture_verify',{
          title:'Validate your recall',
          nbPics: req.session.picnbpics,
          picList: get_pics_list_from_seed((MersenneTwister19937.seed(req.session.picseed)), req.session.picnbpics, 150),
          correct: get_pics_list_from_seed((MersenneTwister19937.seed(req.session.picseed+1)), 30,150),
          pos: get_pics_list_from_seed((MersenneTwister19937.seed(req.session.picseed+2)), 2*req.session.picnbpics, 530),
          rot: get_pics_list_from_seed((MersenneTwister19937.seed(req.session.picseed+3)), req.session.picnbpics, 360),
          seed: req.session.picseed, 
          user:req.user
      });
  }
}


/** create random picture ids to memorize from a seed */
function get_pics_list_from_seed(seed, size, m) {
  const random = new Random(seed);
  var nList = []
  while(nList.length!=size){
    nList.push(1+random.integer(0,m));
    nList = Array.from(new Set(nList));
  }

  return nList;
}

// create a random 32bit int (https://stackoverflow.com/questions/28061016/generate-random-32-bit-number-in-node)
function randU32Sync() {
  return crypto.randomBytes(4).readUInt32BE(0, true);
}