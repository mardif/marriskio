var logger = require(rootPath+"/Logger.js").Logger.getLogger('project-debug.log');

var AI = function(engine){
	this.engine = engine;
};

exports.AI = AI;