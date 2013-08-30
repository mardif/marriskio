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
    var user = req.user;
    var socket = globalSessionManager.getUser(user.id);
    socket.emit("account-received-chat-message", {user: "system", msg: "reminder inviati!"});
    util.log("user mandante: "+user.id);
    
    db.getMatchById(matchId, "players", function(err, match){
        
        if ( err ){ util.log("**** error: "+err) };
        
        for(var i=0; i < match.players.length; i++){
            var id = match.players[i].player.id;
            util.log("utente a cui inviare: "+id);
            var s = globalSessionManager.getUser(id);
            util.log("c'è il socket connesso? "+(s ? "SI" : "NO"));
            if ( s && id != user.id ){
                util.log("il socket è il mandate? "+(id != user.id ? "NO" : "SI"));
                s.emit("account-received-chat-message", {user: "system", msg: "hai ricevuto un reminder da "+user.nick+"!"});
            }
        }
        
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