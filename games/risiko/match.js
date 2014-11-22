var engine = require("./engine");
var util = require("util");
var Session = require("./session").Session;
var common = require("./common");
var logger = require(rootPath+"/Logger.js").Logger.getLogger('project-debug.log');

var Match = function(bean){
  var bean = bean;
	var id = bean.id;
	var motore = new engine.Engine(id);
  var restoredSessionsMap = undefined;

	this.getEngine = function(){
		return motore;
	};
    
	this.getId = function(){
		return id;
	};

  this.setBean = function(dbMatch){
    bean= dbMatch;
  };

  this.getBean = function(){
    return bean;
  };
  
  this.getRestoredSessionsMap = function(){
      return restoredSessionsMap;
  };
  
  this.setEngineData = function(engineData){
    for (var name in engineData) {
        if (engineData.hasOwnProperty(name) ) {
            if ( name !== "sessionsMap" ){
                logger.debug("restore engine data "+name+" with value "+engineData[name]);
                motore[name] = engineData[name];
            }
            else if (name === "sessionsMap" ){
                restoredSessionsMap = engineData[name];
            }
        }
    }

    for(var idx in motore.getSessions() ){
      var ss = motore.getSessions()[idx];
      common.setSessionPropsFromDb(ss, this);
    }

    //this.init();

  };

  this.init = function(){
    for(var i = 0; i < bean.num_players; i++){
      var sess = bean.players[i];
      var mySession = new Session({_id: sess.player.id, nick: sess.nick, color: sess.color, email: sess.player.email, isAI: sess.isAI});
      mySession.setMatchId(id);
      mySession.disconnected = true;
      mySession.statusActive = false;
      motore.addSessionToEngine(mySession);
      //common.setSessionPropsFromDb(mySession, this);

    }
  };

  this.init();

};

exports.Match = Match;