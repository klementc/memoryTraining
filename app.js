var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const { uuid } = require('uuidv4');

var indexRouter = require('./routes/index');
var gameRouter = require('./routes/game');
var numbersRouter = require('./routes/numbers')
var wordsRouter = require('./routes/words');
var piRouter = require('./routes/pi');
var flashWordsRouter = require('./routes/flashWords');
var gridRouter  = require('./routes/grid');
var pictureRouter = require('./routes/picture');

var compression = require('compression');
var helmet = require('helmet');

var app = express();

app.use(session({
  genid: function(req) {
    return uuid() // use UUIDs for session IDs
  },
  secret: 'memgames loves cat',
  resave:true,
  saveUninitialized: true
}))

app.use(helmet());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(compression()); //Compress all routes

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/game/', gameRouter);
app.use('/game/numbers/', numbersRouter);
app.use('/game/words/', wordsRouter);
app.use('/game/pi/', piRouter);
app.use('/game/flash_words/', flashWordsRouter);
app.use('/game/grid/', gridRouter);
app.use('/game/picture/', pictureRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
