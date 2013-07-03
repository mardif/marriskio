var common = require("./common");
var util = require("util");
var cards = require("./cards");

var Engine = function(matchId){
	this.states = {};
	this.worldSize = 42;
	this.engineIsLoaded = false;
	this.turni = [];
	this.turnoAttuale = 0;
	this.stepTurno = -1;
	this.stepsXTurno = 3;
	this.contatoreTurni = 0;
	this.attackFrom = -1;
	this.attackTo = -1;
	this.moveFrom = -1;
	this.moveTo = -1;
	this.sessions = [];
	this.matchId = matchId;
	this.world = new World();
	this.deck = new cards.CardBonusDeck();
	this.statesConquered = 0;
	this.spostamentoFinalEffettuato = false;
    this.gameEnd = false;
    this.winner = undefined;
    this.usersAbandoned = 0;

	this.getSession = function(id){
		//return sessions[id];
		for(var i in this.sessions){
			if ( this.sessions[i].id === id ){
				return this.sessions[i];
				break;
			}
		}
	};

	this.getSessions = function(){
		return this.sessions;
	};

	this.getMatchId = function(){
		return this.matchId;
	};

	this.getWorld = function(){
		return this.world;
	};

	this.addSessionToEngine = function(session){
		this.sessions.push(session);
	};

	this.applyEpidemia = function(enemyId){
		var states = this.getStatesByMember(enemyId);
		for(i in states){
			var stato = states[i];
			var troupes = stato.troupes;
			var minus = Math.floor( ( troupes * 30 ) / 100 );
			if ( minus < 1 ){
				minus = 1;
			}
			troupes -= minus;
			if ( troupes < 1 ){
				troupes = 1;
			}
			stato.troupes = troupes;
		}
	};

	this.removeSessionFromEngine = function(sessionId){
		for(var i in this.sessions){
			var s = this.sessions[i];
			if ( s.id == sessionId ){
				this.sessions.splice(i,1);
				break;
			}
		}
	};

	this.getMainUser = function(){
		for(var i in this.sessions){
			var s = this.sessions[i];
			if ( s.isMaster() ){
				return s.nick;
			}
		}
		return undefined;
	};

	this.getSessioneDiTurno = function(){
		return this.turni[this.turnoAttuale];
	};

	this.initializeState = function(sessionId, statoId, troupes){
		this.states[statoId] = new State(statoId, sessionId, troupes);
	};

	this.addTroupToState = function(statoId, numberIncrement){
		var stato = this.findStatoById(statoId);
		stato.troupes += numberIncrement;
		return stato.troupes;
	};

	this.removeTroupToState = function(statoId, numberDecrement){
		var stato = this.findStatoById(statoId);
		stato.troupes += numberDecrement;
		if ( stato.troupes < 1 ){
			stato.troupes = 1;
		}
		return stato.troupes;
	};

	this.getTroupes = function(statoId){
		return this.findStatoById(statoId).troupes;
	};

	this.changeMember = function(statoId, sessionId){
		this.findStatoById(statoId).member = sessionId;
	};

	this.findStatoById = function(statoId){
		return this.states[statoId];
	};

	this.getStatesByMember = function(sessionId){
		var member = [];
		for(var idx in this.states){
			var stato = this.states[idx];
			if ( stato.member == sessionId ){
				member.push( stato );
			}
		}
		return member;
	};

	this.resetStates = function(singleId){
		if ( singleId ){
			for(var idx in this.states){
				var stato = this.states[idx];
				if ( stato.id == singleId ){
					stato.member = undefined;
					stato.troupes = 0;
					break;
				}
			}
		}
		else{
			for(var idx in this.states){
				var stato = this.states[idx];
				stato.member = undefined;
				stato.troupes = 0;
			}
		}
	};

	this.prevStep = function(){
		/*
		 * Si pu� tornare indietro solo dallo spostamento finale all'attacco e
		 */
		if ( this.stepTurno == 2 && this.spostamentoFinalEffettuato == false ){
			this.stepTurno = 1;
			return true;
		}

		return false;
	};

	this.nextStep = function(){
		this.stepTurno += 1;
		if ( this.stepTurno > 2 ){
			this.stepTurno = 0;
			var session = this.getSession(this.turni[this.turnoAttuale]);
			session.sabotaged = false;
			session.applyingVolatileCard = [];
			session.alliances = [];
			/*
			Controllo che sia stato conquistato uno stato, e qui do 1 carta bonus ( o n, in base ad un parametro ) al giocatore
			*/
			if ( this.statesConquered > 0 ){
				var bonusCard = this.deck.getCard();
				session.addCard( bonusCard );
			}

			this.nextTurn();
            return true;
		}
        return false;
	};
	this.getStepTurno = function(){
		return this.stepTurno;
	};
    
	this.nextTurn = function(){
		this.turnoAttuale += 1;

		if ( this.turnoAttuale >= this.turni.length ){
			this.turnoAttuale = 0;
		}

		var session = this.getSession(this.turni[this.turnoAttuale]);
		while ( session.isAlive() === false || session.AIActivated === true ){
			this.turnoAttuale += 1;
    		session = this.getSession(this.turni[this.turnoAttuale]);
		}


		session.applyingTurnCards = [];
		this.attackFrom = -1;
		this.attackTo = -1;
		this.moveFrom = -1;
		this.moveTo = -1;
		this.contatoreTurni += 1;
		this.statesConquered = 0;
		this.spostamentoFinalEffettuato = false;


		util.log("il giocatore "+session.nick+" ha nel suo mazzo queste carte: "+session.getCards());

	};

	var sortfunction = function(a, b){
		return (b - a) //causes an array to be sorted numerically and descending
	}

	this.attack = function(statoId){

		if ( this.attackFrom == -1 ){
			//non ho settato uno stato da cui attaccare, quindi non posso attaccare...
			return;
		}

		var session = this.getSession(this.turni[this.turnoAttuale]);
		var confini = this.getConfini(this.attackFrom, session.id).confini;

		if ( common.inArray(confini, statoId) ){

			var defender = this.findStatoById(statoId);  //stato in difesa
			var offender = this.findStatoById(this.attackFrom); //stato in attacco

			var sessionDefender = this.getSession(defender.member);

			var numDadiOffender = ( offender.troupes-1 > 3 ? 3 : offender.troupes-1 );
			var numDadiDefender = ( defender.troupes > 3 ? 3 : defender.troupes );

			var realDicesOffender = numDadiOffender;
			var realDicesDefender = numDadiDefender;

			/*------------------------------------------------------*/
			/*
				Controllo che siano state utilizzate delle carte Dado
			*/
			var offenderBonus = false;
			var defenderBonus = false;
			var cardList = session.getVolatileCardsApplied();
			for (i in cardList){
				var card = cardList[i];
				if ( card instanceof cards.OffensiveCard ){
					/*
					esiste una sola carta offensiva che si usa al volo ed influisce sui dadi, ed � questa: usarne pi� di una per turno non comporta alcun beneficio
					*/
					realDicesOffender += 1;
					offenderBonus = true;
					break;
				}
			}
			cardList = sessionDefender.getTurnCardsApplied();
			/*------------------------------------------------------*/
			for (i in cardList){
				var card = cardList[i];
				if ( card instanceof cards.DefensiveCard ){
					/*
					esiste una sola carta difensiva che si usa per tutto il turno ed influisce sui dati, ed � questa: usarne pi� di una per turno non comporta alcun beneficio
					*/
					realDicesDefender += 1;
					defenderBonus = true;
					break;
				}
			}

			var dadiOffender = [];
			var dadiDefender = [];

			//lancio di dadi offender
			for(var i=0;i<realDicesOffender;i++){
				dadiOffender.push( common.random(1,6) );
			}

			//lancio di dadi defender
			for(var i=0;i<realDicesDefender;i++){
				dadiDefender.push( common.random(1,6) );
			}

			dadiDefender.sort(sortfunction);
			dadiOffender.sort(sortfunction);

			var associazioni = ( Math.min(numDadiOffender, numDadiDefender) );
			var isConquistato = false;

			for(var i=0;i<associazioni;i++){
				if ( dadiOffender[i] > dadiDefender[i] ){
					defender.troupes -= 1;
				}
				else{
					//if ( !(offenderBonus == true && offender.troupes == 1) ){
						offender.troupes -= 1;
					//}
				}

				if ( defender.troupes == 0 ){
					//significa che ho conquistato lo stato!
					defender.member = offender.member;
					this.setAttackFrom(-1);
					isConquistato = true;
					break;
				}
			}

			if ( isConquistato ){
				offender.troupes -= numDadiOffender;
				defender.troupes += numDadiOffender;
				this.statesConquered += 1;

				var defenderStates = this.getStatesByMember(defender.member);
				if ( defenderStates.length == 0 ){
					/*
					 * Significa che il giocatore dello stato attaccato non ha pi� stati, quindi ha perso
					 */
					var session = this.getSession(defender.member);
					session.setAlive(false);
				}

			}

			return {
				offender: {dadi: dadiOffender, troupes: offender.troupes, statoId: offender.id, color: session.color},
				defender: {dadi: dadiDefender, troupes: defender.troupes, member:defender.member, statoId: defender.id},
				isConquistato: isConquistato,
				confini: confini,
				sessionId: session.id,
				associazioni: associazioni
			};


		}
		else{
			return {
				error: "Lo stato che stai per attaccare non confina con la tua base di attacco!"
			};
		}
	};

	this.setAttackFrom = function(statoId){
		this.attackFrom = statoId;
	};
	this.setMoveFrom = function(statoId){
		this.moveFrom = statoId;
	};
	this.setMoveTo = function(statoId){
		this.moveTo = statoId;
	};
	this.getMoveTo = function(){
		return this.moveTo;
	};

	this.checkInitialTroupesHasFinished = function(){
		for(var i in this.sessions){
			var s = this.sessions[i];
			if ( s.initialTroupes > 0 ){
				return false;
			}
		}
		this.contatoreTurni += 1;
		this.stepTurno = 0;
		return true;
	};

	this.getTurnoAttuale = function(){
		//----- solo per debug
		/*
		util.log("sessions per il match "+matchId+": "+sessions.length);
		util.log("turno: "+this.turnoAttuale);
		util.log("step: "+this.stepTurno);
		util.log("contatoreTurni: "+this.contatoreTurni);
		for(var i in sessions){
			util.log(sessions[i].nick+": "+sessions[i].id);
		}
		for(var i in this.turni){
			util.log("turno "+i+": "+this.turni[i]);
		}
		util.log("-------------------");
		*/
		//----- fine debug
		var session = this.getSession(this.turni[this.turnoAttuale]);
		if ( session ){
			if ( this.stepTurno == 0 && this.contatoreTurni > this.sessions.length ){//session.troupesToAdd == 0 ){
				var states = this.getStatesByMember(session.id);
				var troupesToPlace = Math.floor(states.length/3);
				/* Controllo se in questo turno il giocatore ha uno o pi� continenti */
				troupesToPlace += this.getArmsFromContinent(states);

				/*
					SABOTAGGIO!!!
				*/
				if ( session.sabotaged == true ){
					troupesToPlace = Math.round( troupesToPlace / 2 );
				}

				session.troupesToAdd = troupesToPlace;
			}
			else if ( this.stepTurno == 0 && (this.contatoreTurni >= 1 && this.contatoreTurni <= this.sessions.length ) ){
				/*
				Se mi trovo nello step iniziale di rafforzamento, non devo dare le truppe
				*/
				this.stepTurno = 1;
				session.troupesToAdd = 0;
			}
			return {session: session,
					stepTurno: this.stepTurno,
					contatoreTurni: this.contatoreTurni,
					troupesToPlace: session.troupesToAdd < 1 ? 1 : session.troupesToAdd,
					sabotaged: session.sabotaged
					};
		}
		else{
			return {};
		}
	}

	this.isEngineLoaded = function(){
		return this.engineIsLoaded;
	};

	this.setEngineLoaded = function(booleanValue){
		this.engineIsLoaded = booleanValue;
	};

	this.inizializzaTurni = function(){

		var players = this.sessions;

		for(var i=0; i < players.length; i++){

			var n = common.random(1, players.length);
			while ( common.inArray(this.turni, players[n-1].id) ){
				//util.log("duplicato!!!!");
				n = common.random(1, players.length);
			}
			players[n-1].turno = this.turni.length;
			this.turni.push(players[n-1].id);

		}
		/*
		util.log("TURNI INIZIALIZZATI:");
		for(var i=0; i < this.turni.length; i++){
			util.log("turno "+i+" -> "+this.turni[i]);
		}
		util.log("players: ");
		for(var i=0; i < players.length; i++){
			var p = players[i];
			util.log("player "+p.nick+" ("+p.id+") turno "+p.turno);
		}
		util.log("********************");
		*/
		this.turnoAttuale = 0;

	};

	this.haveWeAWinner = function(data){
		if ( this.getStatesByMember(data.sessionId).length == 42 ){
			return true;
		}

		return false;
	};

	this.caricaStati = function(){

		var players = this.sessions;

		if ( players.length == 0 ){
			return;
		}

		/* reset delle vecchie associazioni */
		this.resetStates();

		var justAssigned = {};
		var idx = 0;

		for(var i=0; i< this.worldSize; i++){

			var s = common.random(1,this.worldSize);
			while( justAssigned[s] !== undefined ){
				//util.log("stato "+s+" gia assegnato... another one, please!");
				s = common.random(1,this.worldSize);
			}
			//util.log("player: "+idx+"/"+players.length+" have new state: "+s+" - total states: "+(players[idx].states.length+1));

			//players[idx].addState(s, 2);
			this.initializeState(players[idx].id, s, 2);
			justAssigned[s] = "ASSIGNED";


			idx++;

			if ( idx >= players.length ){
				idx = 0;
			}

		}
		this.setEngineLoaded(true);

		this.inizializzaTurni();

		return this.getActualWorld();

	};

	this.getActualWorld = function(){
		//da capire come cambiarlo
		var players = this.sessions;
		var statiAssociati = {};

		for(var i=0;i<players.length;i++){
			var s = players[i];
			s.states = this.getStatesByMember(players[i].id);
			statiAssociati[players[i].id] = s;
			statiAssociati[players[i].id].haveDefensiveCard = s.haveDefensiveCardActive();
		}

		return statiAssociati;
	};

	this.getConfini = function(statoId, sessionId){
		var confini = [];
		var confiniAlleati = [];
		var player = this.getSession(sessionId);
		for(var i in this.world.getConfini()[statoId]){
			var statoConfinante = this.world.getConfini()[statoId][i];
			if ( !this.verifyMembershipStatus(statoConfinante, sessionId) ){
				var canIAttackThisState = true;
				for( idx in player.alliances ){
					var alliance = player.alliances[idx];
					if ( this.findStatoById(statoConfinante).member == alliance ){
						canIAttackThisState = false;
						break;
					}
				}
				if ( canIAttackThisState ){
					confini.push(statoConfinante);
				}
				else{
					confiniAlleati.push(statoConfinante);
				}
			}
		}
		return {confini: confini, confiniAlleati: confiniAlleati};
	};

	this.getContinents = function(){
		return this.world.getContinents();
	};

	this.getMyConfini = function(statoId, sessionId){
		var confini = [];
		for(var i in this.world.getConfini()[statoId]){
			var statoConfinante = this.world.getConfini()[statoId][i];
			if ( this.verifyMembershipStatus(statoConfinante, sessionId) ){
				confini.push(statoConfinante);
			}
		}
		return confini;
	};

	this.verifyMembershipStatus = function(statoId, sessionId){
		return this.findStatoById(statoId).member == sessionId
	};

	this.moveTroupToStateConquered = function(data){

		var troupesMistakes = false;
		var statoFrom = this.findStatoById(data.statoFrom);
		var statoTo = this.findStatoById(data.statoTo);

		if ( statoFrom === undefined || statoTo === undefined ){
			return { statoFrom: false, statoTo: false, error: "Errore di riconoscimento stati", sessionId: data.sessionId };
		}

		if ( statoFrom.troupes < 2 ){
			return { statoFrom: data.statoFrom, statoTo: data.statoTo, error: "Non ci sono piu' truppe da spostare", sessionId: data.sessionId, closePopup: true };
		}

		statoFrom.troupes -= 1;
		statoTo.troupes += 1;

		if ( data.finalMove ){
			this.spostamentoFinalEffettuato = true;
		}

		return {
			troupesMistakes: troupesMistakes,
			statoFrom: statoFrom,
			statoTo: statoTo,
			sessionId: data.sessionId
		};

	};

	this.isStatoConfinante = function(statoRif, statoCheck, sessionId){
		var confini = this.getMyConfini(statoRif, sessionId);
		return common.inArray(confini, statoCheck);
	};

	this.checkStateIsConfinant = function(statoId, sessionId){
		var myStates = this.getStatesByMember(sessionId);
		for(i in myStates){
			var confini = this.getConfini(myStates[i].id, sessionId).confini;
			if ( common.inArray(confini, statoId) ){
				return true;
			}
		}

		return false;
	};

	this.getArmsFromContinent = function(states) {
		var troupes = 0;
		for(c in this.world.continents){
			var continent = this.world.continents[c];

			var statiPresenti = 0;
			var elencoStati = continent.states;
			var numeroStati = elencoStati.length;
			for(idx in states){
				var s = states[idx];
				if ( common.inArray(elencoStati, (s.id).toString()) ){
					statiPresenti += 1;
				}
			}

			if ( statiPresenti == numeroStati ){
				troupes += continent.troupes;
			}

		}

		return troupes;

	};
    
    this.getHumanUsers = function(){
        var list = [];
        for(var idx in this.sessions){
            var s = this.sessions[idx];
            if ( s.AIActivated === false ){
                list.push(s);
            }
        }
        
        return list;
    };

};

var State = function(id, member, troupes){
	this.id = id;
	this.member = member;
	this.troupes = troupes;
}

var World = function(){
	this.confini = {};
	this.continents = {};

	/* Costruzioni delle relazioni tra gli stati */
	this.confini['1'] = ['2', '4','42']; //alaska
	this.confini['2'] = ['1','4','5','3']; //territori nord-ovest
	this.confini['3'] = ['2','5','6','19']; //groenlandia
	this.confini['4'] = ['1','2','5','7']; //alberta
	this.confini['5'] = ['2','3','4','6','7','8']; //ontario
	this.confini['6'] = ['3','5','8']; //quebec
	this.confini['7'] = ['4','5','8','9']; //stati uniti occidentali
	this.confini['8'] = ['5','6','7','9']; //stati uniti orientali
	this.confini['9'] = ['7','8','10']; //messico
	this.confini['10'] = ['9','11','12']; //venezuela
	this.confini['11'] = ['10','12','13']; //peru
	this.confini['12'] = ['10','11','13','36']; //brasile
	this.confini['13'] = ['11','12']; //argentina
	this.confini['14'] = ['15','17','36']; //congo
	this.confini['15'] = ['14','17','16']; //africa del sud
	this.confini['16'] = ['15','17']; //madagascar
	this.confini['17'] = ['14','15','16','36','18','25']; //africa orientale
	this.confini['18'] = ['36','17','25','23']; //egitto
	this.confini['19'] = ['3','21','20']; //islanda
	this.confini['20'] = ['19','21', '24','34']; //norvegia
	this.confini['21'] = ['19','20','22']; //gran bretagna
	this.confini['22'] = ['21','23','24','36']; //europa occidentale
	this.confini['23'] = ['22','24','25','18']; //europa meridionale
	this.confini['24'] = ['20','22','23','34']; //europa settentrionale
	this.confini['25'] = ['17','18','23','34','35','26'];  //medio oriente
	this.confini['26'] = ['25','27','29','35']; //india
	this.confini['27'] = ['39','38','37','35','26','29']; //china
	this.confini['28'] = ['39','42']; //giappone
	this.confini['29'] = ['26','27','30']; //siam
	this.confini['30'] = ['29','31','32']; //indonesia
	this.confini['31'] = ['30','32','33']; //nuova guinea
	this.confini['32'] = ['30','31','33']; //australia occidentale
	this.confini['33'] = ['31','32']; //australia orientale
	this.confini['34'] = ['20','24','25','35','37']; //ucraina
	this.confini['35'] = ['25','34','26','27','37']; //kazakistan
	this.confini['36'] = ['22','18','17','14','12']; //africa del nord
	this.confini['37'] = ['34','35','38','27']; //urali
	this.confini['38'] = ['37','27','39','40','41']; //siberia
	this.confini['39'] = ['27','28','38','40','42']; //mongola
	this.confini['40'] = ['38','39','41','42']; //cita
	this.confini['41'] = ['38','40','42']; //jacuzia
	this.confini['42'] = ['28','39','40','41','1']; //kamchaka

	this.continents = {
			"africa": {
				"states": ['14','15','16','17','18','36'],
				"troupes": 3
			},
			"europa": {
				"states": ['19','20','21','22','23','24','34'],
				"troupes": 5
			},
			"nordAmerica": {
				"states": ['1','2','3','4','5','6','7','8','9'],
				"troupes": 7
			},
			"sudAmerica": {
				"states": ['10','11','12','13'],
				"troupes": 2
			},
			"oceania": {
				"states": ['31','30','32','33'],
				"troupes": 2
			},
			"asia": {
				"states": ['25','26','27','28','29','35','37','38','39','40','41','42'],
				"troupes": 10
			}
	};

	this.getConfini = function(){
		return this.confini;
	};

	this.getContinents = function(){
		return this.continents;
	};

};

exports.Engine = Engine;