var common = require("./common"),
    engine = require("./engine"),
	util = require("util"),
	MatchList = require("./MatchList").MatchList,
	Session = require("./session").Session,
    cryo = require("cryo");

var SessionManager = function(){
    
    var propertiesToRetrieve = [
        "initialTroupes",
        "troupesToAdd",
        "cards",
        "applyingTurnCards",
        "applyingVolatileCard",
        "sabotaged",
        "alliances",
        "states",
        "haveDefensiveCard",
        "turno",
        "AIActivated",
        "nick",
        "color",
        "_id"
    ];

  var matchList = new MatchList();
  var self = this;

	this.getMatchList = function(){
		return matchList;
	};

	//this.addSession = function(session, response, matchId){
  this.addSession = function(user, matchId){

		var mySession = new Session(user);
		var match = matchList.getMatch(matchId);

		if ( match === undefined ){
			return false;
		}
		mySession.setMatchId(match.getId());
        this.setSessionPropsFromDb(mySession, match);
		match.getEngine().addSessionToEngine(mySession);

		return true;
	};

  this.setSessionPropsFromDb = function(mySession, match){
    var masterPlayer = match.getBean().masterPlayer;
    util.log("Player is master? "+(masterPlayer.toString() == mySession.id ? "SI" : "NO"));
    mySession.setMaster( masterPlayer.toString() == mySession.id ? true : false  );
    
    for(var i=0; i< match.getBean().players.length; i++){
      var player = match.getBean().players[i];
      util.log("playerid: "+player.player+" - mySessionId: "+mySession.id);
      if ( player.player.toString() == mySession.id ){
        mySession.color = player.color;
        util.log("Color set "+mySession.color);
        break;
      }
    }
    
    /*
    Se il match è stato ripristinato, provvedo a ricaricare le proprietà della sessione (carte giocate, carte attive, etc)
    */
    util.log("match "+match+" - restoremap: "+match.getRestoredSessionsMap());
    if ( match && match.getRestoredSessionsMap() !== undefined ){
        var map = match.getRestoredSessionsMap();
        if ( map[mySession.id] !== undefined ){
            var m = cryo.parse(map[mySession.id]);//JSON.parse(map[mySession.id]);
            util.log("");
            util.log(" -------------------------------- ");
            for(var idx in propertiesToRetrieve){
                var prop = propertiesToRetrieve[idx];
                util.log("chiave "+prop);
                util.log("valore in sessione: "+mySession[prop]);
                util.log("valore da db: "+m[prop]);
                util.log("");
                mySession[prop] = m[prop];
            }
            util.log(" -------------------------------- ");
        }
        
        //Già che ci sono, aggiunto in lista le sessioni abbandonate
        for(var prp in map){
            var sess = cryo.parse(map[prp]); //JSON.parse(map[prp]);
            if ( sess.AIActivated === true && !this.checkUserExists(sess.nick) && sess.id != mySession.id ){
                var mySession = new Session({_id: sess.id, nick: sess.nick, color: sess.color});
                mySession.setMatchId(match.getId());
                for(var idx in propertiesToRetrieve){
                    var prop = propertiesToRetrieve[idx];
                    mySession[prop] = sess[prop];
                }                
                match.getEngine().addSessionToEngine(mySession);
            }
        }
    }    
    
  };

	this.removeSession = function(matchId, sessionId){
		"use strict";
		/*Rimozione della sessione dalla lista globale*/
		var exists = false;
		var sessions = getInternalSessions();
		for(var i in sessions){
			if ( sessions[i].id == sessionId ){
				sessions.splice(i,1);
				exists = true;
				break;
			}
		}

		/*Rimozione della sessione dal motore della partita*/
		for(var i in matchList.getMatchesList()){
			var match = matchList.getMatchesList()[i];
			match.getEngine().removeSessionFromEngine(sessionId);
		}

		return exists;
	};

	this.setSessionStatus = function(sessionId, enabled){
		var sessions = getInternalSessions();
		for(var i in sessions){
			if ( sessions[i].id == sessionId ){
				sessions[i].disconnected = !enabled;
				break;
			}
		}

		for(var i in matchList.getMatchesList()){
			var match = matchList.getMatchesList()[i];
			var ss = match.getEngine().getSession(sessionId);
			if ( ss ){
				ss.disconnected = !enabled;
				ss.statusActive = enabled;
				break;
			}
		}
	}

	this.setSessionStatus_old = function(sessionId, enabled){
		var enabled = false;
		globalSession = undefined;
		var sessions = getInternalSessions();
		for(var i in sessions){
			if ( sessions[i].id == sessionId ){
				globalSession = sessions[i];
				globalSession.disconnected = !enabled;
				enabled = true;
			}
		}

		if ( enabled == false ){
			return enabled;
		}

		for(var i in matchList.getMatchesList()){
			var match = matchList.getMatchesList()[i];
			var ss = match.getEngine().getSession(sessionId);
			if ( ss ){
				ss.disconnected = false;
			}
			else{
				enabled = false;
				globalSession.disconnected = !globalSession.disconnected;
			}
		}

		return enabled;
	};

	this.removeSessionFromNick = function(nickname){
		"use strict";
		var exists = false;
		var sessions = getInternalSessions();
		for(var i in sessions){
			if ( sessions[i].nick == nickname ){
				sessions.splice(i,1);
				exists = true;
				break;
			}
		}
		return exists;
	};

	this.checkUserExists = function(nickname){
		var sessions = getInternalSessions();
		for(var i in sessions){
			if ( sessions[i].nick === nickname ){
				return true;
			}
		}

		return false;
	};

	this.checkColorAvailable = function(color){
		"use strict";
		var exists = true;
		var sessions = getInternalSessions();
		for(var i in sessions){
			if ( sessions[i].color === color ){
				exists = false;
				break;
			}
		}
		return exists;
	};

	this.checkSessionId = function(id){
		var sessions = getInternalSessions();
		for(var i in sessions){
			if ( sessions[i].id == id ){
				return true;
			}
		}
		return false;
	};

	/*
	 * Da rivedere... il colore deve dipendere dalla partita associata
	 */
	this.getColoriDisponibili = function(){
		var colors = [];
		for(var c in common.colours){
			var color = common.colours[c];
			var available = true;
			for(var s in sessions){
				if ( sessions[s].color == color.color ){
					available = false;
					break;
				}
			}
			if ( available ){
				colors.push( { name: color.name, color: color.color } );
			}
		}

		return colors;
	};

	var getInternalSessions = function(){
		var sessions = [];
		var matches = self.getMatchList().getMatchesList();
		for(var m in matches){
			sessions = sessions.concat(matches[m].getEngine().getSessions());
		}
		return sessions;
	};

	this.getSessions = function(){
		var activeSessions = [];
		var sessions = getInternalSessions();
		for(var i in sessions){
			if ( sessions[i].disconnected == false ){
				activeSessions.push(sessions[i]);
			}
		}
		util.log("sessioni totali attive non disconnesse: "+activeSessions.length);
		return activeSessions;
	};

	this.getSession = function(sessionId){
		var sessions = getInternalSessions();
		for(var i in sessions){
			if ( sessions[i].id == sessionId ){
				return sessions[i];
			}
		}
		return null;
	};

};


module.exports = new SessionManager();