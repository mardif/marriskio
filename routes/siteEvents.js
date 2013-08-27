var common = require(rootPath+"/games/risiko/common"),
  engine = require(rootPath+"/games/risiko/engine"),
  util = require("util"),
	MatchList = require(rootPath+"/games/risiko/MatchList").MatchList,
	Session = require(rootPath+"/games/risiko/session").Session;

var GlobalSessionManager = function(){
    
    var sessions = {};

    this.userIsOnline = function(user){
        return sessions.hasOwnProperty(user._id);
    }

    this.addUser = function(user){
        sessions[""+user._id] = user;
    }

    this.removeUser = function(userId){
        delete sessions[userId];
    }

    this.getUsers = function(){
        return sessions;
    }
    
};

var globalSessionManager = new GlobalSessionManager();

var initializeEvents =  function(sio, socket){

    /*
    Inserisco lo user nella mia sessione così da avere un elenco di utenti attualmente online
    */
    util.log("user session: "+socket.handshake.session.passport.user);
    globalSessionManager.addUser(socket.handshake.session.passport.user);

    sio.sockets.emit("userOnlineResponse", {users: globalSessionManager.getUsers()});
    
    socket.on("account-sent-chat", function(data){
        if ( data && data.msg ){
            data.user = socket.handshake.session.passport.user.nick;
            sio.sockets.emit("account-received-chat-message", data);
        }
    });

    /*
    socket.on("getUsersOnLine", function(){

    });
    */
    
    socket.on('disconnect', function() {
        util.log(" ***************+ DISCONNECTED **************** ");
        sio.sockets.emit("userOnlineResponse", {users: globalSessionManager.getUsers()});
    });

};

exports.globalSessionManager = globalSessionManager;
exports.initializeEvents = initializeEvents;