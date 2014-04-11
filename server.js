// base dependencies for app
/*
require('strong-agent').profile(
    '025e8804a158b72c325319aa8865a280',
    'risiko'
);
*/

global.rootPath = __dirname;

var express = require('express')
  , http = require("http")
  , accessDB = require('./db/accessDB')
  , passport = require('passport')
  , cons = require('consolidate')
  , swig = require('swig')
  , flash = require("connect-flash")
  , io = require("socket.io")
  , ioSession = require('socket.io-session')
  , i18n = require("i18n");


var app = module.exports = express();
global.app = app;

var server = http.createServer(app);

var db = accessDB.getDBInstance;


i18n.configure({
    locales:['it', 'en'],
    register: global,
    defaultLocale: 'en',
    cookie: 'langrisk',
    directory: __dirname+'/locales',
    updateFiles: false
});

swig.init({
    root: 'pages/',
    allowErrors: true, // allows errors to be thrown and caught by express instead of suppressed by Swig
    filters: require('./pages/myswigfilters')
});

i18n.setLocale('en');

// Configuration
app.configure(function(){
  app.engine('html', cons.swig);
  app.set('view engine', 'html');
  app.set('views', 'pages/');
  app.use(express.cookieParser());
  app.use(express.session({
    store: accessDB.getSessionStore
  , secret: 'riskio'
  , key: 'r1s1k0.sid'
  , cookie:{ path: '/', httpOnly: true, maxAge: (1000*3600*12)}
  }));
  app.use(flash());

  app.use(i18n.init);   //se voglio che la lingua sia impostata in base alla lingua del browser, devo de-commentare questa riga
  app.use(function(req, res, next) {
    res.locals.__ = res.__ = function() {
      return i18n.__.apply(req, arguments);
    };
    res.locals.__n = res.__n = function() {
      return i18n.__n.apply(req, arguments);
    };

    res.locals.setLocaleLang = res.setLocaleLang = function(locale){
      i18n.setLocale(locale);
    };
    res.locals.messages = req.session.messages
    next();
  });

  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use(express.csrf());
  
  app.use(passport.initialize());
  app.use(passport.session());
  //app.use(express.static(__dirname + '/pages'));
});


app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

var sio = io.listen(server, {origins: '*:*'});
sio.set('authorization', ioSession(express.cookieParser('riskio'), accessDB.getSessionStore, "r1s1k0.sid"));
sio.set("log level", 1); //0:error, 1-warn, 2-info, 3-debug
sio.set("polling duration", 10);
sio.set("transports", ["xhr-polling"]);

// Routes
require('./routes/routes')(app, sio);

//var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8000;
//var ip   = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || "127.0.0.1";

db.startup(function(){
  var port = 8000; 
  var ip   = "192.168.0.10";
  //var port = process.env.OPENSHIFT_NODEJS_PORT;  //openshift
  //var ip   = process.env.OPENSHIFT_NODEJS_IP;    //openshift
  //var port = process.env.PORT; //heroku
  //var ip   = process.env.IP;   //heroku
  server.listen(port, ip);
  console.log("Express server listening on port %d in %s mode", port, app.settings.env);
});


