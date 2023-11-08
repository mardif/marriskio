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
  , socketIo  = require("socket.io")
  , ioSession = require('socket.io-session')
  , i18n = require("i18n")
  , config = require("./Configuration").Configuration
  , logger = require("./Logger.js")
  , cookieParser = require('cookie-parser')
  , session = require('express-session')
    , bodyParser = require('body-parser')
    , methodOverride = require('method-override')
    , csrf = require('csurf');

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
app.engine('html', cons.swig);
app.set('view engine', 'html');
app.set('views', 'pages/');
app.use(cookieParser());
app.use(session({
store: accessDB.getSessionStore
, secret: 'riskio'
, key: 'r1s1k0.sid'
, cookie:{ path: '/', httpOnly: true, maxAge: (1000*3600*12)}
}));
app.use(flash());
app.enable('verbose errors');
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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());

const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

app.use(passport.initialize());
app.use(passport.session());
//app.use(express.static(__dirname + '/pages'));

if ('production' === app.settings.env) {
  app.disable('verbose errors');
}
if (process.env.NODE_ENV === 'development') {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
}
else if (process.env.NODE_ENV === 'production') {
  app.use(express.errorHandler());
}

var io = socketIo(server,
    {
        cors: {
            origin: '*:*'
        },
        allowEIO3: true, // Abilita EIO 3.0 (necessario per alcune librerie client)
        transports: ['xhr-polling']
    }
);
io.on('connection', function(socket) {
    console.log('Un client si è connesso');
    // Gestisci le connessioni e le operazioni del socket qui
});

//var sio = server.listen(3000, {origins: '*:*'});
io.use(ioSession(cookieParser('riskio'), accessDB.getSessionStore, "r1s1k0.sid"));
//sio.set('authorization', ioSession(cookieParser('riskio'), accessDB.getSessionStore, "r1s1k0.sid"));
//sio.set("log level", 1); //0:error, 1-warn, 2-info, 3-debug
//sio.set("polling duration", 10);
//sio.set("transports", ["xhr-polling"]);


// Routes
require('./routes/routes')(app, io);

//var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8000;
//var ip   = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || "127.0.0.1";

logger.info("env "+process.env.NODE_ENV);

db.startup(function(){
  server.listen(config.getPort(), config.getIP());
  logger.info("Express server listening on %s port %d in %s mode", config.getIP(), config.getPort(), config.getEnvironment());
});


