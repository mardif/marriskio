
/**
  * Module dependencies.
  */
var common = require("../games/risiko/common"),
    Recaptcha = require('recaptcha').Recaptcha,
    db = require('../db/accessDB').getDBInstance,
    async = require("async");

var SSL = true;  //da impostare se l'url sarà HTTPS o no

var PUBLIC_KEY = "6LdE-N0SAAAAAIj6cS-w4LJkZZo9Ayr_bOryJu5c";
var PRIVATE_KEY = "6LdE-N0SAAAAAPNqraS57dFkQqaKeiRwgTUC98Vx";
var recaptcha = new Recaptcha(PUBLIC_KEY, PRIVATE_KEY, {}, SSL);

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
  postRegister: function(req, res, callback) {

    var data = {
        remoteip:  req.connection.remoteAddress,
        remoteport: req.connection.remoteport,
        challenge: req.body.recaptcha_challenge_field,
        response:  req.body.recaptcha_response_field
    };

    var recaptcha = new Recaptcha(PUBLIC_KEY, PRIVATE_KEY, data, true);  //ultimo parametro è SSL
    var newUser = {
              nome : req.param('nome')
            , cognome : req.param('cognome')
            , email : req.param('email')
            , nick: req.param('nick')
            , password: req.param("pass")
    };

    recaptcha.verify(function(success, error_code) {
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
                        error: message, newuser: newUser,
                        action: action
                    });
                    callback(null);
                }
                res.render("login.html", {token: req.session._csrf, info: "Welcome "+docs.cognome+" "+docs.nome +", please insert email and password used in register form"});
                callback(docs);
            });
        }
        else {
            res.render("newUser.html", { recaptcha_form: recaptcha.toHTML(), token: req.session._csrf, error: "Captcha code non valido!", newuser:newUser});
            callback(null);
        }
    });

  },

/*
  // app.get('/about', ...
  about: function(req, res) {
    res.render('about.jade');
  },

  // app.get('/login', ...
  login: function(req, res) {
    res.render('login.jade');
  },
*/

  // app.get('/account', ensureAuthenticated, ...
  getAccount: function(req, res) {
    async.parallel(
        {
            myMatchList: function(callback){
                db.getMatchesAssociated(req.user, function(err, result){
                    callback(err, result);
                });
            },
            allMatches: function(callback){
                db.getAllMatchesOpen(req.user._id, function(err, result){
                    callback(err, result);
                });
            },
            allUsers: function(callback){
                db.getUsers(req.user._id, function(err, result){
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
            res.render('account.html', results);
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
    req.logout();
    res.redirect('/');
  },

    getContacts: function(req, res){
        var query = req.param('q');
        db.getUsers( {
            "$nor":[{"_id":req.session.passport.user._id}],
            //"$or":[{"nick":{"$regex":query,"$options":""}},{"email":{"$regex":query,"$options":""}}]
            "nick": {"$regex":query,"$options":""}
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

    sendInvitations: function(req, res){
        var matchId = req.body.matchId;
        var contacts = req.body.contacts;

        var body = " <html>\
            Hi, your friend "+[req.session.passport.user.name.first, req.session.passport.user.name.last].join(" ")+" \
            has invite you to join to Debellum Match! <br/> \
            Come on, what are you waiting? <a href='http://risiko.mardif.c9.io/account#"+matchId+"' target='_joinDebellumMatch'>Click here and start to play!</a> <br/> \
            <br/> \
            If you are not a registered user, please consider to <a href='http://risiko.mardif.c9.io/register' target='_newUser'>sign in</a> for play with your friends! <br/>\
            <br/>Debellum staff\
            </html>";
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
           from:    "admin@debellum.com",
           to:      addresses.join(","),
           subject: "Debellum invitation"
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

    joinMatch: function(req, res){
        var matchId = req.body.matchId;
        var color = req.body.player_color;
        db.getMatchById(matchId, "players", function(err, match){
            if ( err ) throw err;
            match.players.push({player: req.session.passport.user._id, color: color});
            match.save(function(err, result){
                if (err) throw err;
            });
        });

        res.redirect("/account");
    },

    leaveMatch: function(req, res){
        var matchId = req.body.matchId;
        db.getMatchById(matchId, "players", function(err, match){
            if ( err ) throw err;

            var found = false;
            var i = 0;
            for(; i< match.players.length; i++){
                if ( String(match.players[i].player) === String(req.session.passport.user._id) ){
                    found = true;
                    break;
                }
            }

            if ( found === true ){
                var p = match.players.splice(i, 1);
                if ( p && p.length > 0 ){
                    match.save(function(err, result){
                        if (err) throw err;
                        req.flash("msg_level", "success");
                        req.flash("msg_title", "Confirmed!");
                        req.flash("msg_body", "You left this match successfully!");
                        res.redirect("/account");
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

};
