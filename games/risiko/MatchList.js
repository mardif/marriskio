var Match = require("./match").Match;

var MatchList = function(){
	var matches = [];
  var $this = this;

	this.getMatchesList = function(){
		return matches;
	};

	this.getAvailableMatches = function(){
		var ms = [];
		for(var i in matches){
			var m = matches[i];
			if ( m.getEngine().isEngineLoaded() === false ){ //solo le partite ancora non avviate
				ms.push(m);
			}
		}
		return ms;
	};

	this.getMatch = function(id){
		for(var i in matches){
			var m = matches[i];
			if ( m.getId() == id ){
				return m;
			}
		}

		return undefined;
	};

	this.isAvailableMatch = function(matchId){
		for(var i in matches){
			var m = matches[i];
			if ( m.getEngine().isEngineLoaded() === false && m.getId() == matchId ){
				return true;
			}
		}
		return false;
	};

	this.createMatch = function(matchBean){
		//var m = new Match(new Date().getTime());
    var m = new Match(matchBean);
		matches.push(m);
		return m;
	};

	/*
	this.checkSessionIdFromMatches = function(sessionId){
		var isPresent = false;
		for(var i in matches){
			var match = matches[i];
			if ( match.getSessionManager().checkSessionId(sessionId) ){
				isPresent = true;
				break;
			}
		}
		return isPresent;
	};
	*/

	this.getMatchFromSessionId = function(sessionId){
		for(var i in matches){
			var match = matches[i];
			if ( match.getSessionManager().checkSessionId(sessionId) ){
				return match;
			}
		}
		return undefined;
	};

	/*
	this.enableSessionStatus = function(matchId, sessionId){
		var match = this.getMatch(matchId)
		if ( match ){
			return match.getSessionManager().setSessionStatus(sessionId, true);
		}
		else{
			return false;
		}
	};
	*/

};

exports.MatchList = MatchList;