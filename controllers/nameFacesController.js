const { decks,rand } = require('cards');
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


exports.nf_create_get = function(req, res) {
  res.render('name_faces_form',{user:req.user});
}

exports.nf_create_post = [
  // parse parameters
  validator.body('amount', 'Amount must be a number between 1 and 150').isInt({min:1, max:150}),
  validator.sanitizeBody('durationm').escape(),

  validator.body('durationm', 'Duration must be a number between 1 and 30').isInt({min:0, max:30}),
  validator.sanitizeBody('durationm').escape(),

  validator.body('durations', 'Duration must be a number between 1 and 30').isInt({min:0, max:30}),
  validator.sanitizeBody('durations').escape(),

  // create the game or show errors
  (req, res, next) => {
    const err = validator.validationResult(req);

    // start recall task
    if(! err.isEmpty()) {      
      res.render('name_faces', {
      title:'Start a Name and Faces Game',
      errors: err.array(), 
      user:req.user
      });
      return;
    }else{
      seed = req.body.seed ? req.body.seed : randU32Sync();

      // session data
      req.session.nfgid = uuid();
      req.session.nfseed = seed;
      req.session.nfamount = req.body.amount;
      req.session.nfduration = (Number(req.body.durationm)*60)+Number(req.body.durations);;

      var genre = get_genre_list_from_seed(MersenneTwister19937.seed(req.session.nfseed), req.session.nfamount, 1);
      var names = get_word_list_from_seed(MersenneTwister19937.seed(req.session.nfseed), req.session.nfamount, 1,genre);
      var faces = get_number_list_from_seed(MersenneTwister19937.seed(req.session.nfseed+1), req.session.nfamount, 1, 9999, genre);

      res.render('name_faces_play', {names: names, faces: faces, user:req.user,  timer: (Number(req.body.durationm)*60)+Number(req.body.durations),verifUrl: "/game/name_faces/verify"});
    }
  }
];

/** Perform correction after user's recall validation */
exports.nf_verify = function(req, res) {
  var err=""
  
  if(false) {
      err="Play a game before verifying";
      res.render('words_verify',{
        title:'Validate your recall',
        err:err, 
        user:req.user
    });
    } else {
      var recall;
      var nList = [];
      var score = 0;

      var genre = get_genre_list_from_seed(MersenneTwister19937.seed(req.session.nfseed), req.session.nfamount, 1);
      var names = get_word_list_from_seed(MersenneTwister19937.seed(req.session.nfseed), req.session.nfamount, 1, genre);
      var faces = get_number_list_from_seed(MersenneTwister19937.seed(req.session.nfseed+1), req.session.nfamount, 1, 9999,genre);


      for(var i=0;i<req.session.nfamount;i++) {
          var ok = true;
          console.log(req.body[faces[i]]+" : "+names[i])
          if(undefined!=req.body[faces[i]] && req.body[faces[i]]!=""){
            recall=true;
            
                  if((req.body[faces[i]]+"").toUpperCase()==(names[i]+"").toUpperCase())
                      score++;
          }else{
              ok=false;
          }
      }

      // if this is the end and the user is register, add his score to the database
      if(req.isAuthenticated() && recall){
        user.findOne({username: req.user.username}).exec(function(err, u){
            if(! err){
                Game.findOne({gid: req.session.nfgid}).exec(function(err, ga){
                    if(! err && ! ga){
                        user.findOneAndUpdate({_id: u._id}, { $inc:
                          {xp: score/3}
                        }, function(err, affected, resp) {
                          return console.log(resp);
                        })
                        var g = new Game({
                            user: u._id,
                            gid: req.session.nfgid,
                            type: 'Name and Faces',
                            score: score,
                            maxscore: req.session.nfamount,
                            seed: req.session.nfseed,
                            date: Date.now(),
                            duration: req.session.nfduration
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

      res.render('name_faces_recall',{user:req.user, score:score, names:names, faces:faces,group_by: req.session.cagroup_by, seed:req.session.caseed, recall: recall, nList:nList, amount:req.session.nfamount, xp: score/3})
    }
}


/** create random numbers to memorize from a seed */
function get_number_list_from_seed(seed, nLine, lSize, maxi, genres) {
  const random = new Random(seed);
  var g = genres
  var nList = []
  for(var i=0; i<nLine; i++){
      nList.push([]);
      for(var j=0;j<lSize;j++) {
          if(g[i][j]=="f")
          nList[i].push("f-"+random.integer(0,maxi)+".jpg");
        else
          nList[i].push("m-"+random.integer(0,maxi)+".jpg");
      }
  }
  return nList;
}

/** create random numbers to memorize from a seed */
function get_genre_list_from_seed(seed, nLine, lSize) {
  const random = new Random(seed);
  var nList = []
  for(var i=0; i<nLine; i++){
      nList.push([]);
      for(var j=0;j<lSize;j++) {
          if(random.integer(0,1)){nList[i].push("f");}
          else{nList[i].push("m");}
      }
  }
  return nList;
}

/** fetch random words from dictionnary to memorize from a seed */
function get_word_list_from_seed(seed, nLine, lSize, genres) {
  const random = new Random(seed);
  var g = genres
  var lf = 'public/names/txt/female-first-names.txt';
  var lm = 'public/names/txt/male-first-names.txt';

  // https://stackoverflow.com/questions/6831918/node-js-read-a-text-file-into-an-array-each-line-an-item-in-the-array
  var fs = require('fs');
  var arrayf = fs.readFileSync(lf).toString().trim().split(/\r?\n/);
  var arraym = fs.readFileSync(lm).toString().trim().split(/\r?\n/);

  var nList = []
  for(var i=0; i<nLine; i++){
      nList.push([]);
      for(var j=0;j<lSize;j++) {
          if(g[i][j]=="f")
            nList[i].push(arrayf[random.integer(0,arrayf.length)]);
          else
            nList[i].push(arraym[random.integer(0,arraym.length)]);
      }
  }
  return nList;
}