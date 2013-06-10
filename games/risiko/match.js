var engine = require("./engine");
var util = require("util");

var Match = function(bean){
  var bean = bean
	var id = bean.id;
	var motore = new engine.Engine(id);

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
  
  this.setEngineData = function(engineData){
    for (var name in engineData) {
        if (engineData.hasOwnProperty(name)) {
            util.log("restore engine data "+name+" with value "+engineData[name]);
            motore[name] = engineData[name];
        }
    }

  };

};

exports.Match = Match;