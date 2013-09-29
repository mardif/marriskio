var common = require("./common"),
    engine = require("./engine"),
	util = require("util"),
	MatchList = require("./MatchList").MatchList,
	Session = require("./session").Session,
    cryo = require("cryo");

var SessionManager = function(){
    
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
        common.setSessionPropsFromDb(mySession, match);
		match.getEngine().addSessionToEngine(mySession);

		return true;
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

var sessionManager = new SessionManager();
module.exports = sessionManager;