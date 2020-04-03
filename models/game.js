var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var GameSchema = new Schema(
    {
       user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
       gid: {type: String, required: true},
       type: {type: String, required: true},
       score: {type:Number, required: true},
       maxscore: {type:Number, required: true},
       date: {type: Date, required: true},
       seed: {type: Number},
       add: {type: String}, // for words and pi
    }
)

// export
module.exports = mongoose.model('Game', GameSchema);