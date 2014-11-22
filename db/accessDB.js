// Module dependencies
var mongoStore = require('connect-mongodb');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var cryo = require("cryo");
var zlib = require('zlib');
var util = require("util");
var bcrypt = require('bcrypt');
var EngineData = require(rootPath+"/games/risiko/EngineData").EngineData;
var config = require(rootPath+"/Configuration").Configuration;
var logger = require(rootPath+"/Logger.js").Logger.getLogger('project-debug.log');
var common = require(rootPath+"/games/risiko/common");

// dependencies for authentication
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , FacebookStrategy = require("passport-facebook").Strategy
  , GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var User = require('./models/user');
var Match = require('./models/match');
var Recovery = require("./models/temp");
var AIPlayer =
//var PlayerMatch = require('./models/playerMatch');

// Define local strategy for Passport
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'pass'
  },
  function(email, password, done) {
    User.authenticate(email, password, function(err, user) {
        if (err) { return done(err); }
        if (!user) {
            return done(null, false, { message: 'Incorrect username/password' });
        }
        return done(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: config.getOAuthClientId("facebook"),
    clientSecret: config.getOAuthClientSecret("facebook"),
    callbackURL: "http://"+config.getHost()+"/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    //logger.debug("accessToken: "+accessToken+", refreshToken: "+refreshToken+", profile: "+util.inspect(profile, true));

    process.nextTick(function() {
      logger.debug("ricerca dell'utente "+profile.email+" nel sistema");
      User.find({email: profile._json.email, socialName: "facebook"}, {}, function(err, users) {
        if ( users && users.length == 1 ){
          logger.info("utente trovato!: "+users[0].email);
          users[0].socialToken = accessToken;
          done(err, users[0]); 
        }
        else if ( users && users.length > 1 ){
          logger.warn("rilevati troppi utenti con la seguente email! : "+util.inspect(users, true));
          done(err, null);
        }
        else{
          logger.warn("utente non presente nel sistema");
          accessDB.saveUserAndSetInSession({
            nome: profile._json.first_name,
            cognome: profile._json.middle_name + " "+profile._json.last_name,
            password: "__facebook_password__",
            email: profile._json.email,
            nick: profile._json.username,
            fromSocial: true,
            socialInfo: profile._raw,
            socialToken: accessToken,
            socialName: "facebook"
          }, done);

        }
      });
    });
  }
));

passport.use(new GoogleStrategy({
    clientID: config.getOAuthClientId("google"),
    clientSecret: config.getOAuthClientSecret("google"),
    callbackURL: "http://"+config.getHost()+"/auth/google/oauth2callback"
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function() {
      //util.log("trovato google user: "+util.inspect(profile, true));
      User.find({email: profile._json.email, socialName: "google"}, {}, function(err, users) {
        if ( users && users.length == 1 ){
          logger.info("utente trovato!: "+users[0].email);
          users[0].socialToken = accessToken;
          done(err, users[0]); 
        }
        else if ( users && users.length > 1 ){
          logger.warn("rilevati troppi utenti con la seguente email! : "+util.inspect(users, true));
          done(err, null);
        }
        else{
          logger.warn("utente non presente nel sistema");
          accessDB.saveUserAndSetInSession({
            nome: profile._json.given_name,
            cognome: profile._json.family_name,
            password: "__facebook_password__",
            email: profile._json.email,
            nick: profile._json.email.split("@")[0],
            fromSocial: true,
            socialInfo: profile._raw,
            socialToken: accessToken,
            socialName: "google"
          }, done);

        }
      });      
    });
  }
));

// serialize user on login
passport.serializeUser(function(user, done) {
  done(null, {_id: user._id, nick: user.nick, name: user.name, email: user.email, fromSocial: user.fromSocial, socialToken: user.socialToken, socialName:user.socialName, isAdmin: user.isAdmin});
});

// deserialize user on logout
passport.deserializeUser(function(user, done) {
  User.findById(user._id, function (err, user) {
    done(err, user);
  });
});

var conn = 'mongodb://risiko:r1s1k0@dharma.mongohq.com:10091/risikodb';
if ( process.env.NODE_ENV == "development" ){
  conn = 'mongodb://risikodb:risiko@localhost:27017/risikodb';
}

logger.debug("CONNECTION URL: "+conn);

var sessionStore = new mongoStore({url: conn});

// connect to database
var AccessDB = function(){

  // Define class variable
  var myEventID = null;
  this.AIPlayers = [];

  // initialize DB
  this.startup = function(callback) {
    mongoose.connect(conn);
	var $this = this;
    // Check connection to mongoDB
    mongoose.connection.on('open', function() {
      logger.log('We have connected to mongodb');
      if ( callback ){
        callback();
      }
	  $this.getAIPlayers(function(err, players){
		  $this.AIPlayers = players;
	  });
    });

  },

  // save a user
  this.saveUser = function(userInfo, callback) {
    //console.log(userInfo['fname']);
    var newUser = new User ({
      name : { first: userInfo.nome, last: userInfo.cognome }
    , email: userInfo.email
    , password: userInfo.password
    , nick: userInfo.nick
    , fromSocial: userInfo.fromSocial
    , socialInfo: userInfo.socialInfo
    });

    newUser.save(function(err) {
      if (err) return callback(err, userInfo);//return errorHelper(err, callback);

      User.findById(newUser, function (err, doc) {

        if (err) return errorHelper(err, callback);

        userInfo.id = doc._id;
        logger.debug("id: "+doc._id);
        callback(null, userInfo);

      })

    });
  },

  this.saveUserAndSetInSession = function(userInfo, callback){
    var newUser = new User ({
      name : { first: userInfo.nome, last: userInfo.cognome }
    , email: userInfo.email
    , password: userInfo.password
    , nick: userInfo.nick
    , fromSocial: userInfo.fromSocial
    , socialInfo: userInfo.socialInfo
    , socialName: userInfo.socialName
    , active: true
    });

    newUser.save(function(err) {
      if (err) return callback(err, userInfo);//return errorHelper(err, callback);

      User.findById(newUser, function (err, doc) {

        if (err) return errorHelper(err, callback);

        doc.socialToken = userInfo.socialToken;
        callback(null, doc);

      })

    });
  }

  this.getAllMatchesOpen = function(userId, callback){
      Match.find({running: false, "players.player": {$nin: [userId]}}, null, {sort: {started_at: -1}}).populate('masterPlayer').populate("players.player").exec(function(err, results){
      //PlayerMatch.find({running: false, $not: {player: userId}}).populate("player").populate("match").exec(function(err, results){
          if ( err ){
              throw err;
          }
          callback(null, results);
      });

  },

  this.getMatchesAssociated = function(userid, callback){
      Match.find({"players.player": {$in: [userid]}  }, null, {sort: {started_at: -1}}).populate('masterPlayer').populate("players.player").populate("winner").exec(function (err, results) {
      //PlayerMatch.find({player: user._id}).populate("player").populate("match").exec(function(err, results){
        if (err) throw err;
        callback(null, results);
      });
  },

  this.createNewMatch = function(req, callback){

	  var players = [];
	  var colours = common.colours.slice(0);
	  //elimino il colore preso dall'utente che ha creato il match
	  for(var i=0; i < colours.length; i++){
		  var color = colours[i];
		  if ( color.color == req.body.player_color ){
			  var removed = colours.splice(i,1);
			  logger.debug("rimosso colore "+removed[0].color);
			  break;
		  }
	  }
	  players.push({player: req.user._id, color: req.body.player_color, nick: req.user.nick, isAI: false});
	  if ( req.body.num_players_ai > 0 ){
		  for(var i=1; i<= req.body.num_players_ai; i++) {
			  players.push({ player: this.AIPlayers[i-1]._id, color: colours[i-1].color, nick: this.AIPlayers[i-1].nick, isAI: true });
		  }
	  }
      var newMatch = new Match({
          name: (req.body.name.trim() ? req.body.name : ""+Date.now()),
          num_players: req.body.num_players,
          num_players_ai: req.body.num_players_ai,
          players: players,
          masterPlayer: req.user._id
      });
      newMatch.save(function(err) {
          if (err) return errorHelper(err, callback);
          callback(null, newMatch);
      });

  },

  this.getAIPlayers = function(callback){
      User.find({"isAI": true}, function(err, AIPlayers){
          callback(err, AIPlayers);
      });
  },

  this.createPlayerMatch = function(matchId, playerId, color, callback){
    var playerMatch = new PlayerMatch({
      match: matchId,
      player: playerId,
      color: color
    });
    playerMatch.save(function(err){
      if ( err ) return errorHelper(err, callback);
      callback(null, playerMatch);
    });
  },
  
  this.deleteMatch = function(matchId, callback){
      Match.findOneAndRemove({_id: matchId}, null, function(err, match){
          callback(null, match);
      });
  },

  // disconnect from database
  this.closeDB = function() {
    mongoose.disconnect();
  },

  // get all the users
  this.getUsers = function(filters, fields, callback) {
    User.find(filters, fields, function(err, users) {
      callback(null, users);
    });
  },

  this.getSessionStore = function(){
      return mongoose;
  },

  this.getMatchById = function(matchId, fields, callback){
      
      Match.findById(matchId, fields).populate('winner').populate("players.player").exec(function(err, match){
          callback(err, match);
      });
  },

  this.getUserById = function(userId, fields, callback){
    User.findById(userId, fields, function(err, usr){
      callback(err, usr);
    });
  }

  this.getMatchByIdWithoutPopulate = function(matchId, fields, callback){
      
      Match.findById(matchId, fields).exec(function(err, match){
          callback(err, match);
      });
  },

  this.getColoursAvailableOnMatch = function(matchId, callback){
    Match.findById(matchId, "players", function(err, players){
      callback(err, players);
    });
  };

  this.saveMatchStatus = function(engine, matchBean, callback){
        
    //Trovato il match, provvedo a salvare lo stato serializzato
    var serializedEngineData = saveEngineData(engine);
    logger.debug("match serializedEngineData size: "+serializedEngineData.length);
    zlib.deflate(serializedEngineData, function(error, buffer){
        
        if ( error ){
            return errorHelper(error, callback);
        }
        
        logger.debug("match serializedEngineData compressed size: "+buffer.length);
        matchBean.frozen.created_at = new Date();
        //matchBean.frozen.engine = buffer;  //partita salvata zippata
        matchBean.frozen.engine = serializedEngineData; //partita salvata non zippata
        
        //aggiorno lo stato degli utenti nel match.js nel caso in cui qualcuno abbia abbandonato
        var sessions = engine.getSessions();
        for(var i = 0; i<sessions.length; i++){
            var abandoned = sessions[i].AIActivated;
            if ( abandoned ){
                for(var x = 0; x < matchBean.players.length; x++){
                    var p = matchBean.players[x];
                    if ( p.player.id == sessions[i].id ){
                        p.abandoned = true;
                    }
                }
            }
        }
        
        matchBean.save(function(err){
          if ( err ) return errorHelper(err, callback);
          callback(null, matchBean);
        });
    });
  };
  
  this.setStatusMatch = function(isRunning, matchBean, callback){
      matchBean.running = isRunning;
      matchBean.save(function(err){
          if ( err ){ return errorHelper(err, callback); }
          if ( callback ){
            callback(null, matchBean);
          }
      });
  };

  this.createRecoveryPwd = function(email, callback){
    var recovery = new Recovery({
      email: email,
      expire_at: (Date.now() + 7200000),
      checkKey: bcrypt.genSaltSync(10)
    });
    recovery.save(function(err) {
      if (err) return errorHelper(err, callback);
      callback(null, recovery);
    });
  };

  this.verifyRecoveryPwd = function(email, key, callback){
    Recovery.find({email: email, checkKey: key}, function(err, recovery){
      if ( err ) {
        return errorHelper(err, callback);
      }
      callback(err, recovery);
    });
  };

  this.findRecoveryAndRemove = function(email, callback){
    Recovery.find({email: email}, null, function(err, recs){
      if ( recs && recs.length > 0 ){
        for(var j = 0; j < recs.length; j++){
          recs[j].remove();
        }
      }
    });
  };

  this.changePassword = function(email, newpwd, callback){
    User.findOne({email: email}, null, function(err, doc){
        if ( err ){
          return errorHelper(err, callback);
        }

        doc.password = newpwd;
        doc.save(function(){
          callback(err, doc);
        });
    });
  }

  this.removePlayerFromMatch = function(matchId, playerId, callback){
    Match.update({_id: matchId}, {$pull: { players: { player: playerId } } }, function(err, numberAffected, raw){
      callback(err, numberAffected, raw);
    });
  };

  this.removeSlot = function (matchId, callback)
  {
    Match.update({_id: matchId}, {$inc: {num_players: -1 } }, function(err, numberAffected, raw){
      callback(err, numberAffected, raw);
    });
  }
}

var saveEngineData = function(engine){
    var ed = new EngineData();
    for (var name in ed) {
      if (ed.hasOwnProperty(name)) {
        if ( name !== "sessionsMap" ){
            logger.debug("saving "+name+" data: "+engine[name]);
            ed[name] = engine[name];
        }
        else if( name === "sessionsMap" ){
            for(var i=0;i<engine.getSessions().length;i++){
                var s = engine.getSessions()[i];
                ed.sessionsMap[s.id] = cryo.stringify(s);//JSON.stringify(s);
            }
        }
      }
    }
    
    return cryo.stringify(ed);
    
};

function errorHelper(err, cb) {
    //If it isn't a mongoose-validation error, just throw it.
    if (err.name !== 'ValidationError') return cb(err);
    var messages = {
        'required': "%s is required.",
        'min': "%s below minimum.",
        'max': "%s above maximum.",
        'enum': "%s not an allowed value."
    };

    //A validation error can contain more than one error.
    var errors = [];

    //Loop over the errors object of the Validation Error
    Object.keys(err.errors).forEach(function (field) {
        var eObj = err.errors[field];

        //If we don't have a message for `type`, just push the error through
        if (!messages.hasOwnProperty(eObj.type)){
            errors.push(eObj.type);
        }

        //Otherwise, use util.format to format the message, and passing the path
        else{
            var errMsg = require('util').format(messages[eObj.type], eObj.path);
            logger.warn(errMsg)
            errors.push(errMsg);
        }
    });

    return cb(errors);
}

var accessDB = new AccessDB();
exports.getDBInstance = accessDB;
exports.getSessionStore = sessionStore;
exports.conn = conn;
