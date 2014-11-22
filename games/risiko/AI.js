var logger = require(rootPath+"/Logger.js").Logger.getLogger('project-debug.log');
var _ = require("underscore");

var AI = function(engine, parent){
	var engine = engine;
	var session = parent;

	this.positionateInitialTroupes = function(){
		//inizio col capire in quale continente tra america del sud, oceania ed africa ho più stati
		var continent = checkBestContinentToStart();
		logger.info("continente "+JSON.stringify(continent));
		var bestState = {"id": continent.states[0], num: 0};
		for(idx in continent.states) {
			var confini = engine.getConfini(continent.states[idx].toString(), session.id);
			logger.debug("confini dello stato "+continent.states[idx]+": "+JSON.stringify(confini));

			if ( confini.confini.length > bestState.num ){
				bestState.id = continent.states[idx];
				bestState.num = confini.confini.length;
			}

		}
		logger.info("Miglior stato per posizionamento iniziale: "+JSON.stringify(bestState));
		if ( bestState.num == 0 ){
			logger.info("ok, dovrei avere tutto il continente, per cui rinforzo i confini...");
			var confiniEsterni = [];
			var statiDaControllare = continent.states;

			confiniEsterni = checkConfiniEsterni(statiDaControllare);

			logger.info("confiniEsterni: "+JSON.stringify(confiniEsterni));

		}
		else{
			engine.addTroupToState(bestState.id, parent.initialTroupes);
		}

	}

	var checkConfiniEsterni = function(states){
		var confiniEsterni = [];
		for( var idx in states ){
			var mieiConfini = engine.getMyConfini(states[idx].toString(), session.id);
			for(var j in mieiConfini){
				if ( !_.contains(states, parseInt(mieiConfini[j])) ){
					confiniEsterni.push(mieiConfini[j]);
				}
			}
		}
		return confiniEsterni;
	}

	var checkBestContinentToStart = function(){
		var map = {
			"oceania": { "peso": 0, "tot": 0, "confini_aperti": 1, "truppe": 2, "stati": 0, "states": [], "name": "oceania" },
			"asia": { "peso": 0, "tot": 0, "confini_aperti": 6, "truppe": 10, "stati": 0, "states": [], "name": "asia" },
			"sudAmerica": { "peso": 0, "tot": 0, "confini_aperti": 2, "truppe": 2, "stati": 0, "states": [], "name": "sudAmerica" },
			"nordAmerica": { "peso": 0, "tot": 0, "confini_aperti": 3, "truppe": 7, "stati": 0, "states": [], "name": "nordAmerica" },
			"europa": { "peso": 0, "tot": 0, "confini_aperti": 6, "truppe": 5, "stati": 0, "states": [], "name": "europa" },
			"africa": { "peso": 0, "tot": 0, "confini_aperti": 4, "truppe": 3, "stati": 0, "states": [], "name": "africa" }
		};
		var states = engine.getStatesByMember(parent.id);
		for(var i=0; i<states.length;i++){
			for ( continent in engine.getContinents() ){
				if (_.contains(engine.getContinents()[continent].states, states[i].id.toString()) ){
					map[continent].tot += 1;
					map[continent].stati = engine.getContinents()[continent].states.length;
					map[continent].peso = (( map[continent].tot / map[continent].stati ) / map[continent].confini_aperti);// * (map[continent].truppe/2);
					map[continent].states.push(states[i].id);
					break;
				}
			}
		}
		logger.debug("mappatura rinforzi iniziali utente "+parent.nick+": "+JSON.stringify(map));
		return _.max(map, function(val, key){
			return val.peso;
		});
	}

};

exports.AI = AI;