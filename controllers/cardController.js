const { decks,rand } = require('cards');
const validator = require('express-validator');
var async = require('async');
var crypto = require('crypto');
const { uuid } = require('uuidv4');
var user = require('../models/user');
var Game = require('../models/game');

rand.useArc4(true)

// create a random 32bit int (https://stackoverflow.com/questions/28061016/generate-random-32-bit-number-in-node)
function randU32Sync() {
  return crypto.randomBytes(4).readUInt32BE(0, true);
}

exports.card_create_get = function(req, res) {
  res.render('card_form', {user:req.user});
}

exports.card_create_post = [
  // parse parameters

  validator.body('durationm', 'Duration must be a number between 1 and 30').isInt({min:0, max:30}),
  validator.sanitizeBody('durationm').escape(),

  validator.body('durations', 'Duration must be a number between 1 and 30').isInt({min:0, max:30}),
  validator.sanitizeBody('durations').escape(),

  // create the game or show errors
  (req, res, next) => {
    const err = validator.validationResult(req);

    // start recall task
    if(! err.isEmpty()) {      
      res.render('card_form', {
      title:'Start a Card Game',
      errors: err.array(), 
      user:req.user
      });
      return;
    }else{
      seed = req.body.seed ? (rand.seedArc4(req.body.seed)) :  rand.seedArc4(randU32Sync().toString());
      var deck = new decks.StandardDeck();
      deck.shuffleAll();
      var cards = deck.draw(deck.remainingLength);
      var c=[];
      for(var i=0;i<cards.length;i++){
        c.push(cardToImgName(cards[i]));
      }

      // session data
      req.session.cagid = uuid();
      req.session.caseed = seed;
      req.session.cagroup_by = req.body.group_by;
      req.session.caduration = (Number(req.body.durationm)*60)+Number(req.body.durations);;

      res.render('cards_play', {user:req.user, cards: c, group_by: req.session.cagroup_by, timer: (Number(req.body.durationm)*60)+Number(req.body.durations),verifUrl: "/game/card/verify"});
    }
  }
];

/** Perform correction after user's recall validation */
exports.card_verify = function(req, res) {
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
      var lg=[];
      var score = 0;

      rand.seedArc4(req.session.caseed);
      var deck = new decks.StandardDeck();
      deck.shuffleAll();
      var cardsC = deck.draw(deck.remainingLength);
      var correct={};
      for(var i=0;i<cardsC.length;i++){
        correct[cardToImgName(cardsC[i])]=i;
      }

      var c2=[];
      for(var i=0;i<cardsC.length;i++){
        c2.push(cardToImgName(cardsC[i]));
      }

      rand.seedArc4(req.session.caseed);
      var deck = new decks.StandardDeck();
      var cardsS = deck.draw(deck.remainingLength);
      var c=[];
      for(var i=0;i<cardsS.length;i++){
        c.push(cardToImgName(cardsS[i]));
      }
      console.log(correct);
      for(var i=0;i<52;i++) {
          nList.push(correct[cardToImgName(cardsS[i])]);
          var ok = true;
          if(undefined!=req.body[cardToImgName(cardsC[i])] && req.body[cardToImgName(cardsC[i])]!=""){
            recall=true;
              console.log("comp:"+req.body[cardToImgName(cardsC[i])]+" <->"+ correct[cardToImgName(cardsC[i])])
                  if(req.body[cardToImgName(cardsC[i])]==correct[cardToImgName(cardsC[i])])
                      score++;
                  else
                    ok = false;
          }else{
              ok=false;
          }
          if(ok) lg.push("bg-success");
          else lg.push("bg-danger");
      }

      // if this is the end and the user is register, add his score to the database
      if(req.isAuthenticated() && recall){
        user.findOne({username: req.user.username}).exec(function(err, u){
            if(! err){
                Game.findOne({gid: req.session.cagid}).exec(function(err, ga){
                    if(! err && ! ga){
                        user.findOneAndUpdate({_id: u._id}, { $inc:
                          {xp: score/3}
                        }, function(err, affected, resp) {
                           return console.log(resp);
                        })
                        
                        var g = new Game({
                            user: u._id,
                            gid: req.session.cagid,
                            type: 'Cards',
                            score: score,
                            maxscore: 52,
                            seed: req.session.caseed,
                            date: Date.now(),
                            duration: req.session.caduration
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

      res.render('cards_recall',{
        user:req.user,
        score:score,
        cards:c,
        cards2:c2,
        group_by: req.session.cagroup_by,
        seed:req.session.caseed,
        recall: recall,
        nList:nList,
        lg:lg,
        xp:score/3,
        size:52})
    }
}


// gives the file name for a given card
function cardToImgName(c) {
  var sn = c.rank.shortName;
  if(sn=="A") sn="ace";
  else if(sn=="Q") sn="queen";
  else if(sn=="K") sn="king";
  else if(sn=="J") sn="jack";

  return sn+"_of_"+c.suit.name+".svg";
}