var common = require(rootPath+"/games/risiko/common"),
  engine = require(rootPath+"/games/risiko/engine"),
  util = require("util"),
	MatchList = require(rootPath+"/games/risiko/MatchList").MatchList,
	Session = require(rootPath+"/games/risiko/session").Session,
	db = require('../db/accessDB').getDBInstance;

var GlobalSessionManager = function(){
    
    var sessions = {};

    this.userIsOnline = function(user){
        return sessions.hasOwnProperty(user._id);
    }

    this.addUser = function(socket){
        var user = socket.handshake.session.passport.user;
        sessions[""+user._id] = socket;
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
            ss[id] = sessions[id].handshake.session.passport.user;
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
    util.log("user mandante: "+user.id);
    
    db.getMatchById(matchId, {name:1, players:1}, function(err, match){
        
        if ( err ){ util.log("**** error: "+err) };

        var addresses = [];
        
        for(var i=0; i < match.players.length; i++){
            var player = match.players[i].player;
            var id = player.id;
            util.log("utente a cui inviare: "+id);
            var s = globalSessionManager.getUser(id);
            util.log("c'è il socket connesso? "+(s ? "SI" : "NO"));
            if ( s && id != user.id ){
                util.log("il socket è il mandate? "+(id != user.id ? "NO" : "SI"));
                addresses.push( player.email );
                //s.emit("account-received-chat-message", {user: "system", msg: "hai ricevuto un reminder da "+user.nick+"!"});
                s.emit("account-received-reminder", {
                    msg: "Il tuo avversario "+user.nick+" ti ha sollecitato a partecipare alla partita "+match.name+"!!"
                });
            }
        }

        //ora invio anche l'email
        var body = "<html>\
                <body>\
                    <div style='width:600px;background: url(http://"+req.headers.host+"/logo) no-repeat right center;'>\
                        <div style='height:50px;background-color:#2a333c;border-radius:5px 5px 0 0;border:1px solid #99999;width:100%;color:#999999;font-size:30pt;padding-left:42px;opacity:0.5;filter:alpha(opacity=50);'>DEBELLUM</div>\
                        <div style='border:1px solid #999999;display:inline-block;padding-top:10px;padding-bottom:10px;padding-left:40px;width:100%;'>\
                            Un saluto dal team di Debellum!<br/>\
                            <br/>Il tuo amico "+[req.session.passport.user.name.first, req.session.passport.user.name.last].join(" ")+"\
                            ti ha sollecitato<br/>a partecipare alla sua partita "+match.name+" su Debellum <br/>";
        if ( msg && msg.trim() != "" ){
            body += "Messaggio di "+[req.session.passport.user.name.first, req.session.passport.user.name.last].join(" ")+": <i>\""+msg+"\"</i>";
        }
        body += "           <br/>Cosa stai aspettando? <a href='http://"+req.headers.host+"/account' target='_joinDebellumMatch'>Autenticati e gioca</a><br/>\
                            <br/><br/>Debellum staff\
                        </div>\
                        <div style='height:50px;background-color:#2a333c;border-radius:0 0 5px 5px;border:1px solid #99999;padding-left:42px;width:100%;opacity:0.5;filter:alpha(opacity=50);'>test</div>\
                    </div>\
                </body>\
            </html>";

        var headers = {
           text:    body,
           from:    "admin@debellum.com",
           to:      addresses.join(","),
           subject: "Debellum: Sollecito partita"
        };

        common.sendEmail(headers);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end("{}");            
        
    });
    
}

var globalSio;

var initializeEvents =  function(sio, socket){

    globalSio = sio;

    /*
    Inserisco lo user nella mia sessione così da avere un elenco di utenti attualmente online
    */
    util.log("user session: "+socket.handshake.session.passport.user);
    globalSessionManager.addUser(socket);

    sio.sockets.emit("userOnlineResponse", {users: globalSessionManager.getUsersOnLine()});
    
    socket.on("account-sent-chat", function(data){
        if ( data && data.msg ){
            data.user = socket.handshake.session.passport.user.nick;
            util.log("user "+data.user+" wrote: "+data.msg);
            sio.sockets.emit("account-received-chat-message", data);
        }
    });

    socket.on('disconnect', function() {
        util.log(" ***************+ DISCONNECTED **************** ");
        sio.sockets.emit("userOnlineResponse", {users: globalSessionManager.getUsersOnLine()});
    });

};

exports.globalSessionManager = globalSessionManager;
exports.initializeEvents = initializeEvents;
exports.sendReminder = sendReminder;