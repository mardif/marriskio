var engine = require("./engine");
var util = require("util");

var Match = function(bean){
  var bean = bean
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
                util.log("restore engine data "+name+" with value "+engineData[name]);
                motore[name] = engineData[name];
            }
            else if (name === "sessionsMap" ){
                restoredSessionsMap = engineData[name];
            }
        }
    }

  };

};

exports.Match = Match;