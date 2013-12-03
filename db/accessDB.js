// Module dependencies
var mongoStore = require('connect-mongodb');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var cryo = require("cryo");
var zlib = require('zlib');
var util = require("util");
var bcrypt = require('bcrypt');
var EngineData = require(rootPath+"/games/risiko/EngineData").EngineData;

// dependencies for authentication
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

var User = require('./models/user');
var Match = require('./models/match');
var Recovery = require("./models/temp");
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

// serialize user on login
passport.serializeUser(function(user, done) {
  done(null, {_id: user._id, nick: user.nick, name: user.name, email: user.email});
});

// deserialize user on logout
passport.deserializeUser(function(user, done) {
  User.findById(user._id, function (err, user) {
    done(err, user);
  });
});

//var conn = 'mongodb://risiko:r1s1k0@dharma.mongohq.com:10091/risikodb';
var conn = 'mongodb://risikodb:@localhost:27017/risikodb';

var sessionStore = new mongoStore({url: conn});

// connect to database
var AccessDB = function(){

  // Define class variable
  var myEventID = null

  // initialize DB
  this.startup = function(callback) {
    mongoose.connect(conn);
    // Check connection to mongoDB
    mongoose.connection.on('open', function() {
      console.log('We have connected to mongodb');
      if ( callback ){
        callback();
      }
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
    });

    newUser.save(function(err) {
      if (err) return callback(err, userInfo);//return errorHelper(err, callback);

      User.findById(newUser, function (err, doc) {

        if (err) return errorHelper(err, callback);

        userInfo.id = doc._id;
        console.log("id: "+doc._id);
        callback(null, userInfo);

      })

    });
  },

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
      var newMatch = new Match({
          name: (req.body.name.trim() ? req.body.name : ""+Date.now()),
          num_players: req.body.num_players,
          players: [ {player: req.user._id, color: req.body.player_color} ],
          masterPlayer: req.user._id
      });
      newMatch.save(function(err) {
        if (err) return errorHelper(err, callback);
        callback(null, newMatch);
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
    util.log("match serializedEngineData size: "+serializedEngineData.length);
    zlib.deflate(serializedEngineData, function(error, buffer){
        
        if ( error ){
            return errorHelper(error, callback);
        }
        
        util.log("match serializedEngineData compressed size: "+buffer.length);
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
            util.log("saving "+name+" data: "+engine[name]);
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
            console.log(errMsg)
            errors.push(errMsg);
        }
    });

    return cb(errors);
}

var accessDB = new AccessDB();
exports.getDBInstance = accessDB;
exports.getSessionStore = sessionStore;
exports.conn = conn;