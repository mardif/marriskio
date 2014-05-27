var common = require(rootPath+"/games/risiko/common"),
  engine = require(rootPath+"/games/risiko/engine"),
  util = require("util"),
	MatchList = require(rootPath+"/games/risiko/MatchList").MatchList,
	Session = require(rootPath+"/games/risiko/session").Session,
	db = require('../db/accessDB').getDBInstance,
    _ = require("underscore"),
    Tail = require("tail").Tail;

var logger = require(rootPath+"/Logger.js").Logger.getLogger('project-debug.log');

var GlobalSessionManager = function(){
    
    var sessions = {};

    this.userIsOnline = function(user){
        return sessions.hasOwnProperty(user._id);
    }

    this.addUser = function(socket){
        var user = socket.handshake.session.passport.user;
        logger.debug("user: "+user+" - socket: "+socket);
        if ( user ){
            sessions[""+user._id] = socket;
        }
    }

    this.removeUser = function(userId){
        delete sessions[userId];
    }

    this.getUsers = function(){
        return sessions;
    }
    
    this.getUsersOnLine = function(){
        var ss = {};
        for(var id in sessions){
            try{
                ss[id] = sessions[id].handshake.session.passport.user;
            }
            catch(e){
                logger.warn("error on getUsersOnLine about session expired: "+e);
            }
        }
        return ss;
    }
    
    this.getUser = function(userId){
        return sessions[userId];
    }
    
};

var globalSessionManager = new GlobalSessionManager();

var sendReminder = function(req, res){
    var matchId = req.param("matchId");
    var msg = req.param("msg");
    var user = req.user;
    var socket = globalSessionManager.getUser(user.id);
    socket.emit("account-received-reminder", {msg: "I solleciti ai partecipanti della partita sono stati inviati!"});
    logger.debug("user mandante: "+user.id);
    
    db.getMatchById(matchId, {name:1, players:1}, function(err, match){
        
        if ( err ){ logger.warn("**** error: "+err) };

        var addresses = [];
        
        for(var i=0; i < match.players.length; i++){
            var player = match.players[i].player;
            var id = player.id;
            logger.debug("utente a cui inviare: "+id);
            var s = globalSessionManager.getUser(id);
            logger.debug("c'è il socket connesso? "+(s ? "SI" : "NO"));

            if ( id != user.id ){
                addresses.push( player.email );
            }

            if ( s && id != user.id ){
                logger.debug("il socket è il mandate? "+(id != user.id ? "NO" : "SI"));
                
                //s.emit("account-received-chat-message", {user: "system", msg: "hai ricevuto un reminder da "+user.nick+"!"});
                s.emit("account-received-reminder", {
                    msg: "Il tuo avversario "+user.nick+" ti ha sollecitato a partecipare alla partita "+match.name+"!!"
                });
            }
        }

        //ora invio anche l'email
        var body = common.getHeaderMailTemplate();
        body += "Un saluto dal team di Debellum!<br/>\
                            <br/>Il tuo amico "+[req.session.passport.user.name.first, req.session.passport.user.name.last].join(" ")+"\
                            ti ha sollecitato<br/>a partecipare alla sua partita "+match.name+" su Debellum <br/>";
        if ( msg && msg.trim() != "" ){
            body += "<br/>Messaggio di "+[req.session.passport.user.name.first, req.session.passport.user.name.last].join(" ")+": <br/><i>\""+msg+"\"</i><br/>";
        }
        body += "           <br/>Cosa stai aspettando? <a href='http://"+req.headers.host+"/account' target='_joinDebellumMatch'>Autenticati e gioca</a><br/>\
                            <br/><br/>Debellum staff";
        body += common.getFooterMailTemplate();

        var headers = {
           text:    body,
           from:    "debellum.reminder@debellum.net",
           bcc:      addresses.join(","),
           subject: "Debellum: Sollecito partita"
        };

        common.sendEmail(headers);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end("{}");              
    });  
};

var sendRemovedUserNotification = function (req, res)
{
    var userId = req.body.userId;
    var matchId = req.body.matchId;

    var s = globalSessionManager.getUser(userId);
    logger.debug("c'è il socket connesso? "+(s ? "SI" : "NO"));

    if ( s ){
        s.emit("notify-reminder", {
            msg: "Sei stato esplulso dalla partita #"+matchId+"!!"
        });
    }

    //send mail
    var body = common.getHeaderMailTemplate();        
    body += "Un saluto dal team di Debellum<br/><br/>\
            Volevamo avvisarti che sei stato espulso da una partita alla quale partecipi<br/>\
            Controlla la schermata 'Partite a cui partecipi' per maggiori informazioni. ";
    body += common.getFooterMailTemplate();

    db.getUserById(userId, "email", function(err, utente){
        if ( err ){
            logger.warn("user removed mail notification not sent!");
            return;
        }
        var address = utente.email;
        logger.debug("send removed mail notification to "+address);
        var headers = {
           text:    body,
           from:    "debellum.invites@debellum.net",
           bcc:      address,
           subject: "Debellum: notifica espulsione da una partita"
        };

        common.sendEmail(headers);
    });
    res.writeHead(200, {'Content-Type': 'application/json'});        
    res.end("{}");
};

var globalSio;
var tailDebug = new Tail(rootPath+"/logs/project-debug.log");
var tailSocket = new Tail(rootPath+"/logs/project-socket.log");

var initializeEvents =  function(sio, socket){

    globalSio = sio;

    /*
    Inserisco lo user nella mia sessione così da avere un elenco di utenti attualmente online
    */
    globalSessionManager.addUser(socket);

    sio.sockets.emit("userOnlineResponse", {users: globalSessionManager.getUsersOnLine()});
    
    socket.on("account-sent-chat", function(data){
        if ( data && data.msg ){
            data.user = socket.handshake.session.passport.user.nick;
            data.msg = _.escape(data.msg); //escaping characters from chat
            logger.debug("user "+data.user+" wrote: "+data.msg);
            sio.sockets.emit("account-received-chat-message", data);
        }
    });

    socket.on('disconnect', function() {
        logger.debug(" ***************+ DISCONNECTED **************** ");
        sio.sockets.emit("userOnlineResponse", {users: globalSessionManager.getUsersOnLine()});
    });

    tailDebug.on("line", function(data) {
        var data = JSON.parse(data);
        data.fileSlug = "all-site";
        data.fileName = "project-debug.log";
        data.channel = "01";
        data.value = data.message.replace("/(\[[0-9]+m)*/g"),
        socket.emit("new-data", data);
    });
    tailSocket.on("line", function(data) {
        var data = JSON.parse(data);
        data.fileSlug = "game";
        data.fileName = "project-socket.log";
        data.channel = "02";
        data.value = data.message.replace("/(\[[0-9]+m)*/g"),
        socket.emit("new-data", data);
    });



};

exports.globalSessionManager = globalSessionManager;
exports.initializeEvents = initializeEvents;
exports.sendReminder = sendReminder;
exports.sendRemovedUserNotification = sendRemovedUserNotification;