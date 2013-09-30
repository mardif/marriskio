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
			if ( sessions[i].id == sessionId && sessions[i].matchId == matchId ){
				sessions.splice(i,1);
				exists = true;
				break;
			}
		}

		/*Rimozione della sessione dal motore della partita*/
		for(var i in matchList.getMatchesList()){
			var match = matchList.getMatchesList()[i];
			if ( match.getId() == matchId ){
				match.getEngine().removeSessionFromEngine(sessionId);
			}
		}

		return exists;
	};

	this.setSessionStatus = function(sessionId, matchId, enabled){
		var sessions = getInternalSessions();
		for(var i in sessions){
			if ( sessions[i].id == sessionId && sessions[i].matchId == matchId  ){
				sessions[i].disconnected = !enabled;
				break;
			}
		}

		/*
		for(var i in matchList.getMatchesList()){
			var match = matchList.getMatchesList()[i];
			var ss = match.getEngine().getSession(sessionId);
			if ( ss ){
				ss.disconnected = !enabled;
				ss.statusActive = enabled;
				break;
			}
		}
		*/

		for(var i in matchList.getMatchesList()){
			var match = matchList.getMatchesList()[i];
			if ( match.getId() == matchId ){
				var ss = match.getEngine().getSession(sessionId);
				if ( ss ){
					ss.disconnected = !enabled;
					ss.statusActive = enabled;
					break;
				}
			}
		}
	}

	//non piu usato
	this.checkUserExists = function(nickname){
		var sessions = getInternalSessions();
		for(var i in sessions){
			if ( sessions[i].nick === nickname ){
				return true;
			}
		}

		return false;
	};

	var getInternalSessions = function(){
		var sessions = [];
		var matches = self.getMatchList().getMatchesList();
		for(var m in matches){
			sessions = sessions.concat(matches[m].getEngine().getSessions());
		}
		return sessions;
	};

	this.getSession = function(sessionId, matchId){
		var sessions = getInternalSessions();
		for(var i in sessions){
			if ( sessions[i].id == sessionId && sessions[i].matchId == matchId ){
				return sessions[i];
			}
		}
		return null;
	};

};

var sessionManager = new SessionManager();
module.exports = sessionManager;