/*
 * routes.js
*/

var passport = require('passport');
var start = require('./login');
var common = require(rootPath+"/games/risiko/common");
var db = require(rootPath+'/db/accessDB').getDBInstance;
var sessionManager = require(rootPath+"/games/risiko/sessionManager");
var gamesEvents = require('../games/risiko/gamesEvents');
var siteEvents = require(rootPath+'/routes/siteEvents');
var zlib = require("zlib");
var cryo = require("cryo");
var util = require("util");

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  req.session.redirect_to = req.url || req.originalUrl;
  if ( req.session.redirect_to == "/getMatchUpdates" ){  //non devo beccare la chiamata ajax di aggiornamento partite
    req.session.redirect_to = "/account";
  }
  res.redirect('/loginAuth');
}

function indexRedirect(req, res, next){
    if ( req.isAuthenticated() ){
        res.redirect("/account");
    }
    return next();
}

module.exports = function(app, sio) {

  app.get('/', indexRedirect, start.index);


  app.get('/it', function(req, res){
    res.setLocaleLang("it");
    if ( req.headers.refer ){
      res.redirect(req.headers.refer);
    }
    res.redirect("/");
  });
  app.get('/en', function(req, res){
    res.setLocaleLang("en");
    if ( req.headers.refer ){
      res.redirect(req.headers.refer);
    }
    res.redirect("/");
  });


  app.get('/register', start.getRegister);
  app.post('/register', start.postRegister);

  app.get('/loginAuth', start.login);

  app.get("/recoveryPassword", start.recoveryPassword);

  app.post("/recoveryPassword", start.postRecoveryPassword);

  app.get("/changeYourPWD", start.changePassword);

  app.post("/changeYourPWD", start.changePasswordExecute);

  app.get('/activate', start.activateUser);

  app.post('/loginAuth', function(req, res){
     return passport.authenticate('local',
      {
        successRedirect: req.session.redirect_to ? req.session.redirect_to : "/account",
        failureRedirect: '/loginAuth',
        failureFlash: "Invalid username/password, please try again!"
      })(req, res);
  });


    app.post("/createNewMatch", ensureAuthenticated, start.createNewMatch);

    app.get('/account', ensureAuthenticated, start.getAccount);

    app.get('/logout', start.logout);

    app.get("/getContacts", ensureAuthenticated, start.getContacts);

    app.post("/sendInvitationToMatch", ensureAuthenticated, start.sendInvitations);

    app.post("/joinMatch", ensureAuthenticated, start.joinMatch);
    
    app.get("/joinToMatch", ensureAuthenticated, start.joinMatchFromInvite);

    app.post("/leaveMatch", ensureAuthenticated, start.leaveMatch);
    
    app.post("/deleteMatch", ensureAuthenticated, start.deleteMatch);
    
    app.post("/getMatchUpdates", ensureAuthenticated, start.getMatchUpdates);

    app.get("/allColours", function(req, res){
      common.simpleJSON(res, 200, common.colours);
    });
    
    app.post("/sendReminder", ensureAuthenticated, siteEvents.sendReminder);

    app.post("/sendRemovedUserNotification", ensureAuthenticated, siteEvents.sendRemovedUserNotification);

    app.post("/getColoursAvailable", ensureAuthenticated, start.getColoursAvailable);

    app.post("/startJoinMatch", ensureAuthenticated, function(req, res){

      if ( !sessionManager.getMatchList().getMatch(req.body.matchId)  ){
        /*Provvedo a caricare i dati dal db, poi redirigo alla pagina di gioco*/
        //"players name num_players masterPlayer"
        db.getMatchById(req.body.matchId, null, function(err, match){
          if (err) throw err;
          
          var m = sessionManager.getMatchList().createMatch(match);
          
          //provvedo a unzippare lo statusmatch e aggiornare quello in memoria
          var frozen = match.frozen.engine;
          if ( frozen ){
                //m.setEngine(cryo.parse(serializedMatchEngine)); //partita salvata zippata
                m.setEngineData(cryo.parse(frozen));  //partita salvata non zippata
          }
          res.render("../games/risiko/map.html", { matchId: match.id, sessionId: req.user._id, csrf: req.session._csrf });
        });

      }
      else{
        res.render("../games/risiko/map.html", { matchId: req.body.matchId, sessionId: req.user._id, csrf: req.session._csrf });
      }
    });
    
    app.post("/feedback", ensureAuthenticated, start.sendFeedback);

    app.post("/removeUserFromMatch", ensureAuthenticated, start.removeUserFromMatch);

    app.post("/removeUserAndSlotFromMatch", ensureAuthenticated, start.removeUserAndSlotFromMatch);

    app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['read_stream', 'publish_actions', 'email'] }));

    app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/account', failureRedirect: '/loginAuth' }), 
      function(err, req, res, callback){
        if ( err ){
          req.flash("error", "Ooops, si è verificato il seguente errore: "+err.message.split(":")[0]+". Prova ad accedere con Google oppure registrati!");
          res.redirect("/account");
          return;
        }
      }
    );

    app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.profile',
                                            'https://www.googleapis.com/auth/userinfo.email'] }));
    
    app.get('/auth/google/oauth2callback', passport.authenticate('google', { successRedirect: '/account', failureRedirect: '/loginAuth' }), 
      function(err, req, res, callback){
        if ( err ){
          req.flash("error", "Ooops, si è verificato il seguente errore: "+err.message.split(":")[0]+". Prova ad accedere con Facebook oppure registrati!");
          res.redirect("/account");
          return;
        }
      }
    );

    require("./resources")(app);

    //sio.sockets.on("connection", function(socket){app.get('/auth/google', passport.authenticate('google'));

// Google will redirect the user to this URL after authentication.  Finish
// the process by verifying the assertion.  If valid, the user will be
// logged in.  Otherwise, authentication has failed.
app.get('/auth/google/return', 
  passport.authenticate('google', { successRedirect: '/',
                                    failureRedirect: '/login' }));
    sio.sockets.on("connection", function(socket){
      
      //util.log("sio.sockets.on[connection] -> session: "+util.inspect(socket.handshake, true));
      
      siteEvents.initializeEvents(sio, socket);
      gamesEvents(sio, socket);

    });

}
