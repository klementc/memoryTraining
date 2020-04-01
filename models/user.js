// thanks https://mianlabs.com/2018/05/09/understanding-sessions-and-local-authentication-in-express-with-passport-and-mongodb/

const mongoose = require('mongoose'),
    passportLocalMongoose = require('passport-local-mongoose');
 
const UserSchema =  new mongoose.Schema({});
 
UserSchema.plugin(passportLocalMongoose);
 
module.exports = mongoose.model('User', UserSchema);