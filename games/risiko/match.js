var engine = require("./engine");

var Match = function(bean){
  var bean = bean
	var id = bean.id;
	var motore = new engine.Engine(id);

	this.getEngine = function(){
		return motore;
	};
    
    this.setEngine = function(engine){
        motore = engine;
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

};

exports.Match = Match;