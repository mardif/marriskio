/*
 * routes.js
*/

var passport = require('passport');
var start = require('./login');
var common = require(rootPath+"/games/risiko/common");
var db = require(rootPath+'/db/accessDB').getDBInstance;
var sessionManager = require(rootPath+"/games/risiko/sessionManager");
var gamesEvents = require('../games/risiko/gamesEvents');
var zlib = require("zlib");
var cryo = require("cryo");

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
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

  app.post('/loginAuth', passport.authenticate('local',
    {
      successRedirect: '/account',
      failureRedirect: '/loginAuth',
      failureFlash: "Invalid username/password, please try again!"
    })
  );

    app.post("/createNewMatch", ensureAuthenticated, start.createNewMatch);

    app.get('/account', ensureAuthenticated, start.getAccount);

    app.get('/logout', start.logout);

    app.get("/getContacts", ensureAuthenticated, start.getContacts);

    app.post("/sendInvitationToMatch", ensureAuthenticated, start.sendInvitations);

    app.post("/joinMatch", ensureAuthenticated, start.joinMatch);

    app.post("/leaveMatch", ensureAuthenticated, start.leaveMatch);
    
    app.post("/deleteMatch", ensureAuthenticated, start.deleteMatch);
    
    app.post("/getMatchUpdates", ensureAuthenticated, start.getMatchUpdates);

    app.get("/allColours", function(req, res){
      common.simpleJSON(res, 200, common.colours);
    });

    app.post("/getColoursAvailable", ensureAuthenticated, start.getColoursAvailable);

    app.post("/startJoinMatch", ensureAuthenticated, function(req, res){

      if ( !sessionManager.getMatchList().getMatch(req.body.matchId)  ){
        /*Provvedo a caricare i dati dal db, poi redirigo alla pagina di gioco*/
        db.getMatchById(req.body.matchId, null, function(err, match){
          if (err) throw err;
          
          var m = sessionManager.getMatchList().createMatch(match);
          
          //provvedo a unzippare lo statusmatch e aggiornare quello in memoria
          var frozen = match.frozen.engine;
          if ( frozen ){
                //m.setEngine(cryo.parse(serializedMatchEngine)); //partita salvata zippata
                m.setEngineData(cryo.parse(frozen));  //partita salvata non zippata
          }
          res.render("../games/risiko/map.html", { matchId: match.id, sessionId: req.user._id });
        });

      }
      else{
        res.render("../games/risiko/map.html", { matchId: req.body.matchId, sessionId: req.user._id });
      }
    });
    
    app.post("/restoreJoinMatch", ensureAuthenticated, function(req, res){
        
        if ( !sessionManager.getMatchList().getMatch(req.body.matchId)  ){
        /*Provvedo a caricare i dati dal db, carico i dati del motore di gioco e poi redirigo alla pagina di gioco*/
        db.getMatchById(req.body.matchId, null, function(err, match){
          if (err) throw err;
          
          var m = sessionManager.getMatchList().getMatch(req.body.matchId);
          if ( !m ){
              m = sessionManager.getMatchList().createMatch(match);
          }
          //provvedo a unzippare lo statusmatch e aggiornare quello in memoria
          var frozen = match.frozen.engine;
          require("util").log("frozen: "+frozen);
          zlib.inflate(frozen, function(error, serializedMatchEngine){
              
            if ( error ){
                //res.send("Error on "+error, 404);
                //return;
            }
            
            //m.setEngine(cryo.parse(serializedMatchEngine)); //partita salvata zippata
            m.setEngineData(cryo.parse(frozen));  //partita salvata non zippata
              
            res.render("../games/risiko/map.html", { matchId: match.id, sessionId: req.user._id });
          });
          
        });

      }
      else{
        res.render("../games/risiko/map.html", { matchId: req.body.matchId, sessionId: req.user._id });
      }
        
    });

    require("./resources")(app);

    //sio.sockets.on("connection", function(socket){
    sio.sockets.on("connection", function(socket){
      
      //util.log("sio.sockets.on[connection] -> session: "+util.inspect(socket.handshake, true));
      
      //siteEvents.initializeEvents(sio, socket);
      gamesEvents(sio, socket);

    });

}
