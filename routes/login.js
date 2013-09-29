
/**
  * Module dependencies.
  */
var common = require("../games/risiko/common"),
    Recaptcha = require('recaptcha').Recaptcha,
    db = require('../db/accessDB').getDBInstance,
    async = require("async")
    util = require("util"),
    gsm = require(rootPath+"/routes/siteEvents").globalSessionManager,
    sessionManager = require(rootPath+"/games/risiko/sessionManager");

var SSL = false;  //da impostare se l'url sarà HTTPS o no

var PUBLIC_KEY = "6LdE-N0SAAAAAIj6cS-w4LJkZZo9Ayr_bOryJu5c";
var PRIVATE_KEY = "6LdE-N0SAAAAAPNqraS57dFkQqaKeiRwgTUC98Vx";
var recaptcha = new Recaptcha(PUBLIC_KEY, PRIVATE_KEY, {}, SSL);

var myMatches = undefined;
var availableMatches = undefined;

module.exports = {

  // app.get('/'...)
  index: function(req, res){
      res.render('main.html', {});
  },

  //login: common.staticHandler("./pages/login.html"),
  login: function(req, res){
      res.render('login.html', {time: new Date(), token: req.session._csrf, error: req.flash('error') });
  },

  // app.get('/register'...)
  getRegister: function(req, res) {

    res.render('newUser.html', {recaptcha_form: recaptcha.toHTML(), token: req.session._csrf});
  },

  // app.post('/register'...)
  postRegister: function(req, res) {

    var data = {
        remoteip:  req.connection.remoteAddress,
        remoteport: req.connection.remoteport,
        challenge: req.body.recaptcha_challenge_field,
        response:  req.body.recaptcha_response_field
    };

    var recaptcha = new Recaptcha(PUBLIC_KEY, PRIVATE_KEY, data, SSL);  //ultimo parametro è SSL
    var newUser = {
              nome : req.param('nome')
            , cognome : req.param('cognome')
            , email : req.param('email')
            , nick: req.param('nick')
            , password: req.param("pass")
    };

    recaptcha.verify(function(success, error_code) {
        util.log("error_code: "+error_code);
        //success = true;    //@TODO: da togliere, bypassa il controllo del captcha!!!!
        if (success) {
            db.saveUser(newUser, function(err,docs) {
                if ( err ){
                    console.log("error on : "+require("util").inspect(err, true));
                    var message = err.message;
                    var action;
                    if ( err.code == "11000" ){
                        if ( err.message.indexOf("email") > -1 ){
                            message = "Email already registered!";
                            action = '$("input[name=\\\'email\\\']").parents(".control-group").addClass("error")';
                        }
                        else{
                            message = "Nick already in use, please try another one!";
                            action = '$("input[name=\\\'nick\\\']").parents(".control-group").addClass("error")';
                        }
                    }
                    res.render("newUser.html", {
                        recaptcha_form: recaptcha.toHTML(),
                        token: req.session._csrf,
                        error: message, 
                        newuser: newUser,
                        action: action
                    });
                    //callback(newUser);
                }
                res.render("login.html", {token: req.session._csrf, info: "Welcome "+docs.cognome+" "+docs.nome +", please insert email and password used in register form"});
                //callback(docs);
            });
        }
        else {
            res.render("newUser.html", { recaptcha_form: recaptcha.toHTML(), token: req.session._csrf, error: "Captcha code non valido!", newuser:newUser});
            //callback(null);
        }
    });

  },

  // app.get('/account', ensureAuthenticated, ...
  getAccount: function(req, res) {
    async.parallel(
        {
            myMatchList: function(callback){
                db.getMatchesAssociated(req.session.passport.user._id, function(err, result){
                    callback(err, result);
                });
            },
            allMatches: function(callback){
                db.getAllMatchesOpen(req.session.passport.user._id, function(err, result){
                    var r = [];
                    for(var i=0;i<result.length;i++){
                        var match = result[i];
                        if ( match.free > 0 ){  
                            r.push(match);
                        }
                    }
                    //tornano solo i match che hanno degli slot liberi e di cui non faccio già parte
                    callback(err, r);
                });
            },
            allUsers: function(callback){
                db.getUsers(req.session.passport.user._id, function(err, result){
                    callback(err, result);
                });
            }
        },
        function(err,results) {
            if ( err ){
                throw err;
            }
            results.user= req.user;
            results.token= req.session._csrf;
            results.msg_level = req.flash("msg_level");
            results.msg_title = req.flash("msg_title");
            results.msg_body = req.flash("msg_body");
            var invite = req.flash("inviteFromMail");
            if ( invite && invite != "" ){
                results.inviteFromMail = invite;
            }
            res.render('account.html', results);
        }
    );

  },
  
  getMatchUpdates: function(req, res){
      
      async.parallel({
          myMatches: function(callback){
            db.getMatchesAssociated(req.user._id, function(err, result){
                if ( err ) throw err;
                var r = [];
                for(var i=0;i<result.length;i++){
                    var match = result[i];
                    r.push({match:match, "free": match.free, "infos":match.infos});
                }
                callback(err, r);
            });
          },
          availableMatches: function(callback){
            db.getAllMatchesOpen(req.user._id, function(err, result){
                if ( err ) throw err;
                var r = [];
                for(var i=0;i<result.length;i++){
                    var match = result[i];
                    if ( match.free > 0 ){ 
                        r.push({match: match, "free": match.free, "infos": match.infos});
                    }
                }
                callback(err, r);
            });
          }
        }, 
        function(err,results) {
            if ( err ){
                throw err;
            }
            res.send(results);
        }
      ); 
      
  },

  createNewMatch: function(req, res){

    db.createNewMatch(req, function(err, match){
      if ( err ) throw err;
      /*
      Una volta creato il match sul db, provvedo a caricare anche il bean
      */
      res.redirect("/account");
    });


  },

  // app.get('/logout'...)
  logout: function(req, res){
    gsm.removeUser(req.session.passport.user._id);
    req.logout();
    res.redirect('/');
  },

    getContacts: function(req, res){
        var query = req.param('q');
        db.getUsers( {
            "$nor":[{"_id":req.session.passport.user._id}],
            "$or":[{"nick":{"$regex":query,"$options":""}},{"email":{"$regex":query,"$options":""}}]
            //"nick": {"$regex":query,"$options":""}
        }, {
            _id: 1,
            nick:1,
            email: 1
        },
        function(err, result){
            if ( err ) throw err;
            res.send(result);
        });
    },
    
    joinMatchFromInvite: function(req, res){
        
        req.flash("inviteFromMail", req.param('mid'));
        res.redirect("/account");
        
    },

    sendInvitations: function(req, res){
        var matchId = req.body.matchId;
        var contacts = req.body.contacts;
        
        var body = common.getHeaderMailTemplate();
        body += "Un saluto dal team di Debellum!<br/>\
			                        <br/>Il tuo amico "+[req.session.passport.user.name.first, req.session.passport.user.name.last].join(" ")+"\
			                        ti ha invitato <br/>a giocare <a href='http://"+req.headers.host+"/joinToMatch?mid="+matchId+"' target='_joinDebellumMatch'>questa partita</a> a Debellum <br/>\
			                        <br/>Cosa stai aspettando? <a href='http://"+req.headers.host+"/joinToMatch?mid="+matchId+"' target='_joinDebellumMatch'>Unisciti a noi!</a><br/>\
			                        <br/><br/>Debellum staff";
        body += common.getFooterMailTemplate();
        
        var addresses = [];
        for(var idx in contacts){
            var c = contacts[idx];
            if ( c.hasOwnProperty("email") ){
                addresses.push(c.email);
            }
            else{
                addresses.push(c.id);
            }
        }

        var headers = {
           text:    body,
           from:    "debellum.invites@debellum.net",
           bcc:      addresses.join(","),
           subject: "Debellum: invito"
        };

        common.sendEmail(headers);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end("{}");

        /*
        Se voglio la versione che attende l'invio della email, allora devo
        mettere questo blocco codice invece delle 3 sopra
        */
        /*common.sendEmail(headers, function(err, message) {

            if ( err ){
                console.log("error on "+err);
                res.writeHead(406, {'Content-Type': 'application/json'});
                res.end();
                return;
            }

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end("{}");
        });
        */

    },

    sendFeedback: function(req, res){
        var nome = req.body.name;
        var email = req.body.email;
        var message = req.body.message;

        var body = "Hai ricevuto il seguente feedback da "+nome+" ["+email+"]<br/><br/>\""+message+"\"";

        var headers = {
           text:    body,
           from:    "feedback@debellum.net",
           to:      "mariano.difelice@gmail.com",
           subject: "Debellum: ricevuto feedback"
        };


        common.sendEmail(headers);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end("{}");        
    },

    joinMatch: function(req, res){
        var matchId = req.body.matchId;
        var color = req.body.player_color;
        db.getMatchById(matchId, "players name num_players masterPlayer", function(err, match){
            if ( err ) throw err;

            var addresses = [];
            for(var i=0; i < match.players.length; i++){
                var p = match.players[i].player;
                if ( p.id != req.session.passport.user._id ){
                    addresses.push(p.email);
                }
            }


            match.players.push({player: req.session.passport.user._id, color: color});

            var num_players = match.num_players;

            match.save(function(err, result){
                if (err) throw err;

                var body = common.getHeaderMailTemplate();

                if ( match.players.length == num_players ){
                //Se tutti i posti del match sono stati occupati, si manda un'email che è tutto pronto per giocare!
                    body += "Un saluto dal team di Debellum<br/><br/>\
                        Volevamo avvisarti che l'utente <br/><b>"+req.session.passport.user.name.first+" "+req.session.passport.user.name.last+" ("+req.session.passport.user.nick+")</b><br/>\
                        si e' unito alla partita "+match.name+" a cui partecipi<br/>\
                        Ora tutti gli slot della partita sono occupati<br/>\
                        quindi la partita e' pronta per iniziare!<br/><br/>\
                        Cosa aspetti? <a href='http://"+req.headers.host+"/account'>Fatti trovare online e pronto alla battaglia!</a>";

                }
                else{
                    body += "Un saluto dal team di Debellum<br/><br/>\
                    Volevamo avvisarti che l'utente <br/><b>"+req.session.passport.user.name.first+" "+req.session.passport.user.name.last+" ("+req.session.passport.user.nick+")</b><br/>\
                    si e' unito alla partita "+match.name+" a cui partecipi<br/>\
                    <br/>Invita i tuoi amici a giocare con te a Debellum!";
                }
                body += common.getFooterMailTemplate();


                util.log("send mail to "+addresses.join(","));

                var headers = {
                   text:    body,
                   from:    "debellum.invites@debellum.net",
                   bcc:      addresses.join(","),
                   subject: "Debellum: notifica"
                };

                common.sendEmail(headers);

                if ( result.players.length == num_players ){
                    //ora che tutti gli slot sono assegnati, provvedo a creare il mondo!

                    db.getMatchById(matchId, "players num_players masterPlayer", function(err, allOk){

                        var m = sessionManager.getMatchList().getMatch(matchId);
                        if ( !m ){
                            m = sessionManager.getMatchList().createMatch(allOk);
                        }
                        m.getBean().running = true;

                        var engine = m.getEngine();
                        engine.caricaStati();

                        db.saveMatchStatus(engine, m.getBean(), function(err, dbMatch){
                            if ( err ){
                                util.log("Error saving match "+result.id);
                                return;
                            }
                            util.log("Match "+m.getId()+" was saved correctly");
                        });
                    });
                }


            });
        });

        res.redirect("/account");
    },
    
    deleteMatch: function(req, res){
        var matchId = req.body.matchId;
        db.deleteMatch(matchId, function(err, match){
            var result = {};
            if (err) {
                req.flash("msg_level", "error");
                req.flash("msg_title", "What the hell!!");
                req.flash("msg_body", "Oooops... your match was not deleted, shit!!");

            }
            else{
                req.flash("msg_level", "info");
                req.flash("msg_title", "Confirmed!!");
                req.flash("msg_body", "Ok, your match was deleted!");
            }
            res.redirect("/account");
        });
    },

    leaveMatch: function(req, res){
        var matchId = req.body.matchId;
        db.getMatchById(matchId, "players", function(err, match){
            if ( err ) throw err;

            var found = false;
            var i = 0;
            for(; i< match.players.length; i++){
                if ( String(match.players[i].player.id) === String(req.session.passport.user._id) ){
                    found = true;
                    break;
                }
            }

            if ( found === true ){
                var p = match.players.splice(i, 1);
                if ( p && p.length > 0 ){

                    db.getMatchByIdWithoutPopulate(matchId, "players", function(err, result){
                        if (err) throw err;
                        result.players.splice(i, 1);
                        result.save(function(err, result){
                            if (err) throw err;
                            req.flash("msg_level", "success");
                            req.flash("msg_title", "Confermato!");
                            req.flash("msg_body", "Hai abbandonato il match con successo!");
                            res.redirect("/account");
                        });
                    });

                }
                else{
                  req.flash("msg_level", "error");
                  req.flash("msg_title", "What the hell!!");
                  req.flash("msg_body", "Oooops... you are not playing this match!");
                  res.redirect("/account");
                }
            }
            else{
                req.flash("msg_level", "error");
                req.flash("msg_title", "What the hell!!");
                req.flash("msg_body", "Oooops... you are not playing this match!");
                res.redirect("/account");
            }

        });

    },

    getColoursAvailable: function(req, res){
      var matchId = req.body.matchId;
      var colours = common.colours.slice(0);
      db.getColoursAvailableOnMatch(matchId, function(err, match){
        if (err) throw err;

          for(var i=0;i<match.players.length;i++){
            var p = match.players[i];
            for(var j=0;j<colours.length;j++){
              if ( colours[j].color === p.color ){
                colours.splice(j, 1);
                break;
              }
            }
          }

          common.simpleJSON(res, 200, colours);
      });
    },

    getMatch: function(matchId){
      var match = sessionManager.getMatchList().getMatch(matchId);
      if ( match ){
        return match;
      }
      return null;
    }

};
