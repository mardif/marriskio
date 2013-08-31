var util = require("util");
var c = require("./cards");
var common = require("./common");

var Session = function(user){

  this.init = function(){
    util.log("user [id="+this.id+"][nick="+this.nick+"][color="+this.color+"]");
  }

  this.statusActive = true;
  this.disconnected = false;
  this.id = user._id;
  this.nick = user.nick;
  this.color = user.color;
  this.internalSession = user;
	this.master = false;
	this.initialTroupes = 5;
	this.troupesToAdd = 0;
	this.matchId = undefined;
	this.alive = true;  //significa che il giocatore è in gioco: diventa false quando non ha più territori
    
	this.cards = [];/* new c.AtomicBombCard(), new c.DefensiveCard(), new c.OffensiveCard(), new c.AllianceCard(),
    new c.AirAttack(), new c.GroundAttack(), new c.DistanceAttack(), new c.SingleReinforcement(),
    new c.DoubleReinforcement(), new c.TripleReinforcement(), new c.SabotageCard(), new c.SpyCard(), new c.Epidemia()
	];*/

	this.applyingTurnCards = [];
	this.applyingVolatileCard = [];
	this.interactiveCard = undefined;  //quando ricevo l'interazione, provvedo a resettarla ad undefined
	this.sabotaged = false;
	this.alliances = [];
    
    this.AIActivated = false;

	/* METODO PUBBLICO DA CHIAMARE QUANDO VENGONO APPLICATE LE CARTE BONUS */
	this.applyCard = function(card){
		if ( card ){
			if ( card.applyOnAllRound === true ){
				this.applyingTurnCards.push(card);
			}
			else if ( card.applyOnAllRound === false ){
				this.applyingVolatileCard.push(card);
			}
			this.removeCard(card.id);

			if ( card.canInteract ){
				this.interactiveCard = card;
			}
		}
	};

	this.haveDefensiveCardActive = function(){
		for(var idx in this.applyingTurnCards){
			var card = this.applyingTurnCards[idx];
			if ( card.type === c.DEFENSIVE_CARD ){
				return true;
			}
		}
		return false;
	};

	this.invalidateInteractCard = function(){
		this.interactiveCard = undefined;
	};

	this.stealCard = function(){
		var idxCard = common.random(1,this.cards.length);
		var card = this.cards[idxCard-1];
		this.removeCard(card.id);
		return card;
	};

	this.getVolatileCardsApplied = function(){
		return this.applyingVolatileCard;
	};


	this.getTurnCardsApplied = function(){
		return this.applyingTurnCards;
	};

	this.addAlliance = function(sessionId){
		this.alliances.push(sessionId);
	};

	this.isAlliancedWithMe = function(enemyId){
		for(var idx in this.alliances){
			var alliance = this.alliances[idx];
			if ( alliance === enemyId ){
				return true;
			}
		}

		return false;
	};

	this.isAlive = function(){
		return this.isAlive;
	};

	this.setAlive = function(isAlive){
		this.alive = isAlive;
	};

	this.addCard = function(card){
		util.log("aggiungo la carta "+card+" a quelle disponibili per il giocatore "+this.nick);
		this.cards.push( card );
	};

	this.removeCard = function(cardId){
		util.log("cards dell'utente "+this.nick+": "+this.cards);
		for(var i in this.cards){
			if ( this.cards[i].id == cardId ){
				util.log("l'utente "+this.nick+" ha giocato la carta "+this.cards[i]);
				this.cards.splice(i,1);
				break;
			}
		}
	};

	this.getCards = function(){
		return this.cards;
	};

	this.getCard = function(id){
		for(var i in this.cards){
			if ( this.cards[i].id == id ){
				return this.cards[i];
			}
		}

		return undefined;
	}

	this.addTroupToState = function(statoId, numberIncrement, initial){

		if ( initial === true ){
			numberIncrement = ( numberIncrement > this.initialTroupes ? 0 : numberIncrement );
			this.initialTroupes -= numberIncrement;

		}
		else{
			numberIncrement = ( numberIncrement > this.troupesToAdd ? 0 : numberIncrement );
			this.troupesToAdd -= numberIncrement;
		}

		return {initialTroupes: this.initialTroupes, troupesToAdd: this.troupesToAdd, numberIncrement: numberIncrement};
	};

    this.isActive = function(){
        return this.statusActive;
    };

	this.setMaster = function(value){
		this.master = value;
	};

	this.isMaster = function(){
		return this.master;
	};

	this.setMatchId = function(matchId){
		this.matchId = matchId;
	};

  this.init();
};

exports.Session = Session;