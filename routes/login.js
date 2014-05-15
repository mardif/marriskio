
/**
  * Module dependencies.
  */
var common = require("../games/risiko/common"),
    Recaptcha = require('recaptcha').Recaptcha,
    db = require('../db/accessDB').getDBInstance,
    async = require("async")
    util = require("util"),
    siteEvents = require(rootPath+"/routes/siteEvents"),
    sessionManager = require(rootPath+"/games/risiko/sessionManager"),
    config = require(rootPath+"/Configuration").Configuration;

var logger = require(rootPath+"/Logger.js").Logger.getLogger('project-debug.log');

var gsm = siteEvents.globalSessionManager;
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

  recoveryPassword: function(req, res){
    res.render("recoveryPwd.html", {token: req.session._csrf});
  },

  postRecoveryPassword: function(req, res){

    var email = req.body.email;
    db.getUsers({email: email}, null, function(err, users){

        if ( err ){
            util.error("error on postRecoveryPassword: "+err.message);
            res.render("recoveryPwd.html", {
                        token: req.session._csrf,
                        error: err.message, 
                    });
            return;
        }

        if ( users && users.length == 0 ){
            res.render("recoveryPwd.html", {
                        token: req.session._csrf,
                        error: "Spiacente, questo indirizzo non è presente nei nostri sistemi", 
                    });
            return;
        }

        if ( users && users.length == 1 ){

            db.findRecoveryAndRemove(email);

            var user = users[0];
            db.createRecoveryPwd(email, function(err, recovery){

                if ( err ){
                    res.render("recoveryPwd.html", {
                                token: req.session._csrf,
                                error: "Si è verificato un problema durante la generazione dell'email. Riprova più tardi!", 
                            });
                    return;                    
                }

                //Invio della email
                var key = new Buffer(recovery.checkKey).toString("base64");
                var mail = new Buffer(email).toString("base64");

                var body = common.getHeaderMailTemplate();
                body += "Un saluto dal team di Debellum<br/>\
                Non ricordi la tua password di accesso? Nessun problema!<br/>\
                Clicca il link di seguito per reimpostare una nuova password!<br/>\
                <a href='http://www.debellum.net/changeYourPWD?uid="+mail+"&s="+key+"'>http://www.debellum.net/changeYourPWD?uid="+mail+"&s="+key+"</a><br/>\
                <br/>\
                Se non hai richiesto il cambio password<br/>\
                ti preghiamo di ignorare questa email.<br/>\
                <br/>\
                A presto!<br/>\
                <a href='http://www.debellum.net'>Debellum</a>";
                body += common.getFooterMailTemplate();

                var headers = {
                   text:    body,
                   from:    "wargod@debellum.net",
                   bcc:      email,
                   subject: "Debellum: Recupero Password!"
                };

                common.sendEmail(headers);

                res.render("login.html", {
                            token: req.session._csrf,
                            info: "L'email è stata inviata correttamente all'indirizzo da te indicato.", 
                        });
                return;
                
            });

        }

    });

  },

  changePassword: function(req, res){
    var email = new Buffer(req.param("uid"), "base64").toString("ascii");
    var key   = new Buffer(req.param("s"), "base64").toString("ascii");

    db.verifyRecoveryPwd(email, key, function(err, recoveries){

        if ( err || recoveries == null || (recoveries != null && recoveries.length == 0) ){
            res.render("recoveryPwd.html", {
                token: req.session._csrf,
                error: "Link di recupero password non valido!"
            });
            return;
        }

        var recovery = recoveries[0];
        if ( new Date().getTime() > recovery.expire_at.getTime() ){
            res.render("recoveryPwd.html", {
                token: req.session._csrf,
                error: "La sessione di recupero password è scaduta! Se necessiti cambiare la password, inserisci di nuovo la tua email"
            });

            recovery.remove();

            return;
        }

        res.render("changePassword.html", {
            token: req.session._csrf,
            email: email
        });

    });

  },

  changePasswordExecute: function(req, res){

    var email = req.body.email;
    var newpwd = req.body.pass;

    db.changePassword(email, newpwd, function(err, doc){
        if ( err ){
            res.render("changePassword.html", {
                token: req.session._csrf,
                email: email,
                error: "Si è verificato un errore nell'impostazione della nuova password. "+err.message
            });
        }

        db.findRecoveryAndRemove(email);

        res.render("login.html", {
            token: req.session._csrf, 
            info: "Password impostata correttamente!"
        });
    });

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
        logger.warn("error_code: "+error_code);
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
                    return;
                    //callback(newUser);
                }

                //invio della email
                var body = common.getHeaderMailTemplate();
                var link = "http://www.debellum.net/activate?q="+new Date().getTime()+"&u="+docs.id+"&i="+new Date().getTime();
                body += "Benvenuto "+docs.cognome+" "+docs.nome+"!<br/><br/>\
                Completa questo passaggio per cominciare a giocare!<br/><br/>\
                Stai ricevendo questo messaggio perchè ti sei registrato su Debellum.<br/>\
                Per completare il processo di registrazione clicca sul seguente link:<br/><br/>\
                <a href='"+link+"'>"+link+"</a><br/><br/>\
                Ci vediamo presto!<br/><br/>\
                Un saluto dal team di Debellum!";
                body += common.getFooterMailTemplate();


                var headers = {
                   text:    body,
                   from:    "wargod@debellum.net",
                   bcc:      docs.email,
                   subject: "Attiva il tuo account su Debellum"
                };

                common.sendEmail(headers);


                res.render("login.html", {token: req.session._csrf, info: "Salve "+docs.cognome+" "+docs.nome +", un'email di attivazione è stata inviata all'indirizzo da te fornito. Accedi e clicca sul link per attivare il tuou account ed iniziare a giocare!"});
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

            results.googleClientId = config.getOAuthClientId("google");
            results.googleCookiePolicy = config.getHost();

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

        if ( req.session && req.session.passport && req.session.passport.user && req.session.passport.user.fromSocial == true && req.session.passport.user.socialName == "facebook" ){
            var formData = {
                form: {
                    access_token: req.session.passport.user.socialToken,
                    message: "Ho appena creato la partita "+match.name+" su http://www.debellum.net e "+(match.num_players-1 == 1 ? "c'è ancora 1 posto libero!" : "ci sono ancora "+(match.num_players-1)+" posti liberi!")+" Chi si unisce?",
                    link: "http://www.debellum.net"
                }
            };
            require("request").post("https://graph.facebook.com/me/feed", formData, function(error, response, body){
                logger.error("CREATION MATCH POSTED ON FACEBOOK WALL WITH ERROR: "+util.inspect(error, true)+" - POSTID: "+body);
            });
        }

      res.redirect("/account");
    });


  },

  // app.get('/logout'...)
  logout: function(req, res){
    if ( req.session.passport.user ){
        gsm.removeUser(req.session.passport.user._id);
    }
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

        db.getMatchById(req.param('mid'), "players name", function(err, match){
            if ( err ){
                req.flash("msg_level", "error");
                req.flash("msg_title", "Match non trovato!");
                req.flash("msg_body", "Oooops... il match a cui volevi partecipare sembra scomparso!");
                res.redirect("/account");
                return;
            }
            var justExists = false;

            if ( !match || ( match && !match.players ) ){
                res.redirect("/account");
                return;
            }

            for(var i=0; i < match.players.length; i++){
                var p = match.players[i].player;
                if ( p.id == req.session.passport.user._id ){
                    justExists = true;
                }
            }

            if ( justExists ){
                req.flash("msg_level", "error");
                req.flash("msg_title", "Azione non valida!");
                req.flash("msg_body", "Hey! Sei gi&agrave; iscritto a questo match!!");
            }
            else{
                req.flash("inviteFromMail", req.param('mid'));
            }
            res.redirect("/account");

        });
        
        
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
                addresses.push(c._id);
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
        var nome = req.session.passport.name.first+" "+req.session.passport.name.last;
        var email = req.session.passport.user.email;
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


                logger.debug("send mail to "+addresses.join(","));

                var headers = {
                   text:    body,
                   from:    "debellum.invites@debellum.net",
                   bcc:      addresses.join(","),
                   subject: "Debellum: notifica"
                };

                common.sendEmail(headers);

                if ( result.players.length == num_players ){
                    //ora che tutti gli slot sono assegnati, provvedo a creare il mondo!

                    db.getMatchById(matchId, "players name num_players masterPlayer", function(err, allOk){

                        var m = sessionManager.getMatchList().getMatch(matchId);
                        if ( !m ){
                            m = sessionManager.getMatchList().createMatch(allOk);
                        }
                        m.getBean().running = true;

                        var engine = m.getEngine();
                        engine.caricaStati();

                        db.saveMatchStatus(engine, m.getBean(), function(err, dbMatch){
                            if ( err ){
                                logger.error("Error saving match "+result.id);
                                return;
                            }
                            logger.info("Match "+m.getId()+" was saved correctly");
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
                req.flash("msg_title", "Cribbio...");
                req.flash("msg_body", "Oooops... la partita non è stata cancellata!!");

            }
            else{
                req.flash("msg_level", "info");
                req.flash("msg_title", "Confermato!!");
                req.flash("msg_body", "Ok, la tua partita è stata cancellata!");
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
    },

    activateUser: function(req, res){
        var userId = req.param('u')
        db.getUserById(userId, "active", function(err, utente){

            if ( err ){
                res.render("login.html", {token: req.session._csrf, info: "Si è verificato un errore durante l'attivazione del tuo account"});
                return;
            }

            utente.active = true;
            utente.save(function(err, result){

                if ( err ){
                    res.render("login.html", {token: req.session._csrf, info: "Si è verificato un errore durante l'attivazione del tuo account"});
                    return;
                }

                res.render("login.html", {token: req.session._csrf, info: "Il tuo account è stato attivato con successo! Ora puoi effettuare il login ed iniziare a giocare!"});
            });

        });
    },

    removeUserFromMatch: function(req, res)
    {
        var userId = req.body.userId;
        var matchId = req.body.matchId;

        db.removePlayerFromMatch(matchId, userId, function(err, rowAffected, raw){
            if ( err ){
                util.error("Error on removeUserFromMatch: "+err);
                return;
            }
            logger.debug("users removed from match: "+rowAffected);
            logger.debug("raw: "+raw);
        });

        siteEvents.sendRemovedUserNotification(req, res);
    },

    removeUserAndSlotFromMatch: function(req, res)
    {
        var userId = req.body.userId;
        var matchId = req.body.matchId;

        db.removePlayerFromMatch(matchId, userId, function(err, rowAffected, raw){
            if ( err ){
                util.error("Error on removeUserFromMatch: "+err);
                return;
            }
            logger.debug("users removed from match: "+rowAffected);
            logger.debug("raw: "+raw);             
        });
        
        db.removeSlot(matchId, function (err, rowAffected, raw){
            if ( err ){
                util.error("Error on removeUserFromMatch: "+err);
                return;
            }
            logger.debug("slot removed from match: "+matchId);            
        });
        siteEvents.sendRemovedUserNotification(req, res);   
    },
};
