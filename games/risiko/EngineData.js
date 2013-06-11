var EngineData = function(){
    
    this.states = undefined;
	this.worldSize= undefined;
	this.engineIsLoaded= undefined;
	this.turni= undefined;
	this.turnoAttuale= undefined;
	this.stepTurno= undefined;
	this.stepsXTurno= undefined;
	this.contatoreTurni= undefined;
	this.attackFrom= undefined;
	this.attackTo= undefined;
	this.moveFrom= undefined;
	this.moveTo= undefined;
	//this.sessions= undefined;
	this.matchId= undefined;
	this.world= undefined;
	//this.deck= undefined;
	this.statesConquered= undefined;
	this.spostamentoFinalEffettuato= undefined;
    
    this.sessionsMap = {};
    
};

exports.EngineData = EngineData;