var EPIDEMIA = "EPIDEMIA";
var ATOMIC_BOMB_CARD = "ATOMIC_BOMB_CARD";
var DEFENSIVE_CARD = "DEFENSIVE_CARD";
var OFFENSIVE_CARD = "OFFENSIVE_CARD";
var ALLIANCE_CARD = "ALLIANCE_CARD";
var AIR_ATTACK = "AIR_ATTACK";
var GROUND_ATTACK = "GROUND_ATTACK";
var DISTANCE_ATTACK = "DISTANCE_ATTACK";
var SINGLE_REINFORCEMENT = "SINGLE_REINFORCEMENT";
var DOUBLE_REINFORCEMENT = "DOUBLE_REINFORCEMENT";
var TRIPLE_REINFORCEMENT = "TRIPLE_REINFORCEMENT";
var SABOTAGE_CARD = "SABOTAGE_CARD";
var SPY_CARD = "SPY_CARD";

var CardBonusDeck = function(){
	var cards = [];
	var index = 0;

	this.getCard = function(){
		var card = cards[index];
		index++;
		if ( index > cards.length ){
			index = 0;
			shuffle(cards);
		}
		return card;
	};

	this.init = function(){
		cards.push( new Epidemia() );
		cards.push( new Epidemia() );
		cards.push( new Epidemia() );
		cards.push( new AtomicBombCard() );
		cards.push( new AtomicBombCard() );
		cards.push( new AtomicBombCard() );
		cards.push( new AtomicBombCard() );
		cards.push( new DefensiveCard() );
		cards.push( new DefensiveCard() );
		cards.push( new DefensiveCard() );
		cards.push( new DefensiveCard() );
		cards.push( new DefensiveCard() );
		cards.push( new OffensiveCard() );
		cards.push( new OffensiveCard() );
		cards.push( new OffensiveCard() );
		cards.push( new OffensiveCard() );
		cards.push( new OffensiveCard() );
		cards.push( new AllianceCard() );
		cards.push( new AllianceCard() );
		cards.push( new AllianceCard() );
		cards.push( new AllianceCard() );
		cards.push( new AirAttack() );
		cards.push( new AirAttack() );
		cards.push( new AirAttack() );
		cards.push( new AirAttack() );
		cards.push( new GroundAttack() );
		cards.push( new GroundAttack() );
		cards.push( new GroundAttack() );
		cards.push( new GroundAttack() );
		cards.push( new GroundAttack() );
		cards.push( new DistanceAttack() );
		cards.push( new DistanceAttack() );
		cards.push( new DistanceAttack() );
		cards.push( new DistanceAttack() );
		cards.push( new DistanceAttack() );
		cards.push( new DistanceAttack() );
		cards.push( new SingleReinforcement() );
		cards.push( new SingleReinforcement() );
		cards.push( new SingleReinforcement() );
		cards.push( new SingleReinforcement() );
		cards.push( new SingleReinforcement() );
		cards.push( new SingleReinforcement() );
		cards.push( new DoubleReinforcement() );
		cards.push( new DoubleReinforcement() );
		cards.push( new DoubleReinforcement() );
		cards.push( new DoubleReinforcement() );
		cards.push( new DoubleReinforcement() );
		cards.push( new TripleReinforcement() );
		cards.push( new TripleReinforcement() );
		cards.push( new TripleReinforcement() );
		cards.push( new TripleReinforcement() );
		cards.push( new SabotageCard() );
		cards.push( new SabotageCard() );
		cards.push( new SabotageCard() );
		cards.push( new SabotageCard() );
		cards.push( new SabotageCard() );
		cards.push( new SpyCard() );
		cards.push( new SpyCard() );
		cards.push( new SpyCard() );
		cards.push( new SpyCard() );

		// then ... suffle order!
		shuffle(cards);

	};

	var shuffle = function(o){
		for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	};

	this.init();

};

(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
  // The base Class implementation (does nothing)
  this.Class = function(){};

  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;

            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];

            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);
            this._super = tmp;

            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }

    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;

    return Class;
  };
})();

var diff = 10;

var Card = Class.extend({

	id: undefined,
	canInteract: false,
	applyOnAllRound: false,
	action: undefined,
	classCard: undefined,
    type: undefined,

	init: function(title, description){
		this.title = title;
		this.description = description;
		this.id = new Date().getTime() - diff;
		diff -= 10;
	},

	getTemplate: function(){
		return "<div></div>";
	}

});
Card.prototype.toString = function(){
	return this.title;
};

var DicesCard = Card.extend({

	init: function(title, description, gapDiceOffender, gapDiceDefender){
		this._super(title, description);
		this.gapDiceOffender = gapDiceOffender;
		this.gapDiceDefender = gapDiceDefender;
	}

});

var TroupesCard = Card.extend({

	interactMessage: undefined,
	interactiveWith: undefined,

	init: function(title, description, gapTroupesOffender, gapTroupesDefender){
		this._super(title, description);
		this.gapTroupesOffender = gapTroupesOffender;
		this.gapTroupesDefender = gapTroupesDefender;
		this.canInteract = true;
		this.interactiveWith = "MARKERS";
	}

});

var PlayersCard = Card.extend({

	interactMessage: undefined,
	interactiveWith: undefined,

	init: function(title, description){
		this._super(title, description);
		this.canInteract = true;
		this.interactiveWith = "PLAYERS";
	}

});

var AtomicBombCard = TroupesCard.extend({

	template: undefined,

  init: function(){
    this._super( "Bomba Atomica", "Lancia una bomba atomica su un territorio avversario eliminando 5 armate !", 0, -5 );
	this.interactMessage = "Clicca sul territorio nemico dove vuoi sganciare la bomba!";
	this.applyOnAllRound = false;
	this.classCard = "ca-item-image-atomic";
    this.type = ATOMIC_BOMB_CARD;
	this.action = "socket.emit('sendAttack', { \
			sessionId: sessionId, \
			matchId: matchId, \
			statoId: theMarker.id, \
			near: false \
		});";
	this.sound = "sm.play('atomicbomb');";
	this.template = "<div class='ca-item'> \
						<div class='ca-item-back-color ca-item-back-red'> \
						</div> \
						<div class='ca-item-main' card='"+this.id+"'> \
							<h3>"+this.title+"</h3> \
							<div class='ca-item-image "+this.classCard+"'></div> \
							<h4> \
								<span class='ca-quote'>&ldquo;</span> \
								<span>"+this.description+"</span> \
							</h4> \
							<div class='ca-item-help'></div> \
						</div> \
						<div class='ca-content-wrapper'> \
								<div class='ca-content'> \
									<h6>Spiegazione della carta</h6> \
									<a href='#' class='ca-close'>close</a> \
									<div class='ca-content-text'> \
										<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
										<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
										<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
									</div> \
									<ul> \
										<li> \
											<a href='#'>Read more</a> \
										</li> \
									</ul> \
								</div> \
						</div> \
					 </div>";
  },

  getTemplate: function(){
	return this.template;
  }

});

var DefensiveCard = DicesCard.extend({

	template: undefined,

	init: function(){
		this._super("Strategia Difensiva", "In fase difensiva, aggiungo un dado di risposta per tutto il round!", 0, 1);
		this.applyOnAllRound = true;
        this.type = DEFENSIVE_CARD;
		this.classCard = "ca-item-image-difesaCard";
		this.template = "<div class='ca-item'> \
			<div class='ca-item-back-color ca-item-back-green'> \
			</div> \
			<div class='ca-item-main' card='"+this.id+"'> \
				<h3>"+this.title+"</h3> \
				<div class='ca-item-image "+this.classCard+"'></div> \
				<h4> \
					<span class='ca-quote'>&ldquo;</span> \
					<span>"+this.description+"</span> \
				</h4> \
				<div class='ca-item-help'></div> \
			</div> \
			<div class='ca-content-wrapper'> \
					<div class='ca-content'> \
						<h6>Spiegazione della carta</h6> \
						<a href='#' class='ca-close'>close</a> \
						<div class='ca-content-text'> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
						</div> \
						<ul> \
							<li> \
								<a href='#'>Read more</a> \
							</li> \
						</ul> \
					</div> \
			</div> \
		 </div>";
	},

  getTemplate: function(){
	return this.template;
  }
});

var OffensiveCard = DicesCard.extend({

	template: undefined,

	init: function(){
		this._super("Strategia Offensiva", "Quando attacco, dispongo di un dado aggiuntivo!", 1, 0);
		this.applyOnAllRound = false;
		this.classCard = "ca-item-image-attaccoCard";
        this.type = OFFENSIVE_CARD;
		this.template = "<div class='ca-item'> \
			<div class='ca-item-back-color ca-item-back-red'> \
			</div> \
			<div class='ca-item-main' card='"+this.id+"'> \
				<h3>"+this.title+"</h3> \
				<div class='ca-item-image "+this.classCard+"'></div> \
				<h4> \
					<span class='ca-quote'>&ldquo;</span> \
					<span>"+this.description+"</span> \
				</h4> \
				<div class='ca-item-help'></div> \
			</div> \
			<div class='ca-content-wrapper'> \
					<div class='ca-content'> \
						<h6>Spiegazione della carta</h6> \
						<a href='#' class='ca-close'>close</a> \
						<div class='ca-content-text'> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
						</div> \
						<ul> \
							<li> \
								<a href='#'>Read more</a> \
							</li> \
						</ul> \
					</div> \
			</div> \
		 </div>";
	},

  getTemplate: function(){
	return this.template;
  }
});

var AllianceCard = PlayersCard.extend({

	template: undefined,

	init: function(){
		this._super("Alleanza", "Alleati con un tuo nemico: nel suo turno non potr&agrave; attaccarti!");
		this.interactMessage = "Seleziona il nemico con cui vuoi stringere alleanza";
		this.applyOnAllRound = true;
        this.type = ALLIANCE_CARD;
		this.canInteract = true;
		this.classCard = "ca-item-image-alleanza";
		this.action = "socket.emit('Alliance', { \
			sessionId: sessionId, \
			matchId: matchId, \
			playerId: playerId \
		});";
		this.template = "<div class='ca-item'> \
			<div class='ca-item-back-color ca-item-back-green'> \
			</div> \
			<div class='ca-item-main' card='"+this.id+"'> \
				<h3>"+this.title+"</h3> \
				<div class='ca-item-image "+this.classCard+"'></div> \
				<h4> \
					<span class='ca-quote'>&ldquo;</span> \
					<span>"+this.description+"</span> \
				</h4> \
				<div class='ca-item-help'></div> \
			</div> \
			<div class='ca-content-wrapper'> \
					<div class='ca-content'> \
						<h6>Spiegazione della carta</h6> \
						<a href='#' class='ca-close'>close</a> \
						<div class='ca-content-text'> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
						</div> \
						<ul> \
							<li> \
								<a href='#'>Read more</a> \
							</li> \
						</ul> \
					</div> \
			</div> \
		 </div>";
	},

  getTemplate: function(){
	return this.template;
  }
});

var AirAttack = TroupesCard.extend({

	template: undefined,

	init: function(){
		this._super("Attacco aereo", "Attacca un tuo nemico confinante e distruggi 3 armate!", 0, -3);
		this.interactMessage = "Clicca sul territorio nemico a te confinante per portare a termine l'attacco!";
		this.applyOnAllRound = false;
        this.type = AIR_ATTACK;
		this.classCard = "ca-item-image-attaccoAereo";
		this.action = "socket.emit('sendAttack', { \
			sessionId: sessionId, \
			matchId: matchId, \
			statoId: theMarker.id, \
			near: true \
		});";
		this.template = "<div class='ca-item'> \
			<div class='ca-item-back-color ca-item-back-red'> \
			</div> \
			<div class='ca-item-main' card='"+this.id+"'> \
				<h3>"+this.title+"</h3> \
				<div class='ca-item-image "+this.classCard+"'></div> \
				<h4> \
					<span class='ca-quote'>&ldquo;</span> \
					<span>"+this.description+"</span> \
				</h4> \
				<div class='ca-item-help'></div> \
			</div> \
			<div class='ca-content-wrapper'> \
					<div class='ca-content'> \
						<h6>Spiegazione della carta</h6> \
						<a href='#' class='ca-close'>close</a> \
						<div class='ca-content-text'> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
						</div> \
						<ul> \
							<li> \
								<a href='#'>Read more</a> \
							</li> \
						</ul> \
					</div> \
			</div> \
		 </div>";
	},

  getTemplate: function(){
	return this.template;
  }
});

var GroundAttack = TroupesCard.extend({

	template: undefined,

	init: function(){
		this._super("Attacco con truppe", "Attacca un tuo nemico confinante e distruggi 2 armate!", 0, -2);
		this.interactMessage = "Clicca sul territorio nemico a te confinante per portare a termine l'attacco!";
		this.applyOnAllRound = false;
        this.type = GROUND_ATTACK;
		this.classCard = "ca-item-image-attaccoTerra";
		this.action = "socket.emit('sendAttack', { \
			sessionId: sessionId, \
			matchId: matchId, \
			statoId: theMarker.id, \
			near: true \
		});";
		this.template = "<div class='ca-item'> \
			<div class='ca-item-back-color ca-item-back-red'> \
			</div> \
			<div class='ca-item-main' card='"+this.id+"'> \
				<h3>"+this.title+"</h3> \
				<div class='ca-item-image "+this.classCard+"'></div> \
				<h4> \
					<span class='ca-quote'>&ldquo;</span> \
					<span>"+this.description+"</span> \
				</h4> \
				<div class='ca-item-help'></div> \
			</div> \
			<div class='ca-content-wrapper'> \
					<div class='ca-content'> \
						<h6>Spiegazione della carta</h6> \
						<a href='#' class='ca-close'>close</a> \
						<div class='ca-content-text'> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
						</div> \
						<ul> \
							<li> \
								<a href='#'>Read more</a> \
							</li> \
						</ul> \
					</div> \
			</div> \
		 </div>";
	},

  getTemplate: function(){
	return this.template;
  }
});

var DistanceAttack = TroupesCard.extend({

	template: undefined,

	init: function(){
		this._super("Cecchino", "Attacca un tuo nemico confinante dagli avamposti e distruggi 1 armata!", 0, -1);
		this.interactMessage= "Clicca sul territorio nemico a te confinante per portare a termine l'attacco!";
		this.applyOnAllRound = false;
        this.type = DISTANCE_ATTACK;
		this.classCard = "ca-item-image-cecchino";
		this.action = "socket.emit('sendAttack', { \
			sessionId: sessionId, \
			matchId: matchId, \
			statoId: theMarker.id, \
			near: true \
		});";
		this.sound = "sm.play('cecchino');";
		this.template = "<div class='ca-item'> \
			<div class='ca-item-back-color ca-item-back-red'> \
			</div> \
			<div class='ca-item-main' card='"+this.id+"'> \
				<h3>"+this.title+"</h3> \
				<div class='ca-item-image "+this.classCard+"'></div> \
				<h4> \
					<span class='ca-quote'>&ldquo;</span> \
					<span>"+this.description+"</span> \
				</h4> \
				<div class='ca-item-help'></div> \
			</div> \
			<div class='ca-content-wrapper'> \
					<div class='ca-content'> \
						<h6>Spiegazione della carta</h6> \
						<a href='#' class='ca-close'>close</a> \
						<div class='ca-content-text'> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
						</div> \
						<ul> \
							<li> \
								<a href='#'>Read more</a> \
							</li> \
						</ul> \
					</div> \
			</div> \
		 </div>";
	},

  getTemplate: function(){
	return this.template;
  }
});

var SingleReinforcement = TroupesCard.extend({

	template: undefined,

	init: function(){
		this._super("Rinforzo", "Ottieni 1 rinforzo da posizionare in uno dei miei stati!", 1, 0);
		this.interactMessage= "Clicca su un tuo territorio per effettuare il rifornimento di truppe!";
		this.applyOnAllRound = false;
        this.type = SINGLE_REINFORCEMENT;
		this.action = "socket.emit('getReinforcements', { \
			sessionId: sessionId, \
			matchId: matchId, \
			statoId: theMarker.id \
		});";
		this.template = "<div class='ca-item'> \
			<div class='ca-item-back-color ca-item-back-green'> \
			</div> \
			<div class='ca-item-main' card='"+this.id+"'> \
				<h3>"+this.title+"</h3> \
				<div class='ca-item-image "+this.classCard+"'></div> \
				<h4> \
					<span class='ca-quote'>&ldquo;</span> \
					<span>"+this.description+"</span> \
				</h4> \
				<div class='ca-item-help'></div> \
			</div> \
			<div class='ca-content-wrapper'> \
					<div class='ca-content'> \
						<h6>Spiegazione della carta</h6> \
						<a href='#' class='ca-close'>close</a> \
						<div class='ca-content-text'> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
						</div> \
						<ul> \
							<li> \
								<a href='#'>Read more</a> \
							</li> \
						</ul> \
					</div> \
			</div> \
		 </div>";
	},

  getTemplate: function(){
	return this.template;
	}
});

var DoubleReinforcement = TroupesCard.extend({

	template: undefined,

	init: function(){
		this._super("Doppio Rinforzo", "Ottieni 2 rinforzi da posizionare in uno dei miei stati!", 2, 0);
		this.interactMessage= "Clicca su un tuo territorio per effettuare il rifornimento di truppe!";
		this.applyOnAllRound = false;
        this.type = DOUBLE_REINFORCEMENT;
		this.action = "socket.emit('getReinforcements', { \
			sessionId: sessionId, \
			matchId: matchId, \
			statoId: theMarker.id \
		});";
		this.template = "<div class='ca-item'> \
			<div class='ca-item-back-color ca-item-back-green'> \
			</div> \
			<div class='ca-item-main' card='"+this.id+"'> \
				<h3>"+this.title+"</h3> \
				<div class='ca-item-image "+this.classCard+"'></div> \
				<h4> \
					<span class='ca-quote'>&ldquo;</span> \
					<span>"+this.description+"</span> \
				</h4> \
				<div class='ca-item-help'></div> \
			</div> \
			<div class='ca-content-wrapper'> \
					<div class='ca-content'> \
						<h6>Spiegazione della carta</h6> \
						<a href='#' class='ca-close'>close</a> \
						<div class='ca-content-text'> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
						</div> \
						<ul> \
							<li> \
								<a href='#'>Read more</a> \
							</li> \
						</ul> \
					</div> \
			</div> \
		 </div>";
	},

  getTemplate: function(){
	return this.template;
	}
});

var TripleReinforcement = TroupesCard.extend({

   template : undefined,

	init: function(){
		this._super("Triplo Rinforzo", "Ottieni 3 rinforzi da posizionare in uno dei miei stati!", 3, 0);
		this.interactMessage= "Clicca su un tuo territorio per effettuare il rifornimento di truppe!";
		this.applyOnAllRound = false;
        this.type = TRIPLE_REINFORCEMENT;
		this.action = "socket.emit('getReinforcements', { \
			sessionId: sessionId, \
			matchId: matchId, \
			statoId: theMarker.id \
		});";
		this.template = "<div class='ca-item'> \
			<div class='ca-item-back-color ca-item-back-green'> \
			</div> \
			<div class='ca-item-main' card='"+this.id+"'> \
				<h3>"+this.title+"</h3> \
				<div class='ca-item-image "+this.classCard+"'></div> \
				<h4> \
					<span class='ca-quote'>&ldquo;</span> \
					<span>"+this.description+"</span> \
				</h4> \
				<div class='ca-item-help'></div> \
			</div> \
			<div class='ca-content-wrapper'> \
					<div class='ca-content'> \
						<h6>Spiegazione della carta</h6> \
						<a href='#' class='ca-close'>close</a> \
						<div class='ca-content-text'> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
						</div> \
						<ul> \
							<li> \
								<a href='#'>Read more</a> \
							</li> \
						</ul> \
					</div> \
			</div> \
		 </div>";
	},

  getTemplate: function(){
	return this.template;
	}
});

var SabotageCard = PlayersCard.extend({

	template: undefined,

	init: function(){
		this._super("Sabotaggio", "Effettua un sabotaggio ad un tuo nemico facendogli prendere il 50% armate in meno nel suo turno!");
		this.interactMessage= "Seleziona l'utente che vuoi sabotare...";
		this.applyOnAllRound = false;
		this.canInteract = true;
        this.type = SABOTAGE_CARD;
		this.classCard = "ca-item-image-sabotaggio";
		this.action = "socket.emit('sabotage', { \
			sessionId: sessionId, \
			matchId: matchId, \
			playerId: playerId \
		});";
		this.template = "<div class='ca-item'> \
			<div class='ca-item-back-color ca-item-back-red'> \
			</div> \
			<div class='ca-item-main' card='"+this.id+"'> \
				<h3>"+this.title+"</h3> \
				<div class='ca-item-image "+this.classCard+"'></div> \
				<h4> \
					<span class='ca-quote'>&ldquo;</span> \
					<span>"+this.description+"</span> \
				</h4> \
				<div class='ca-item-help'></div> \
			</div> \
			<div class='ca-content-wrapper'> \
					<div class='ca-content'> \
						<h6>Spiegazione della carta</h6> \
						<a href='#' class='ca-close'>close</a> \
						<div class='ca-content-text'> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
						</div> \
						<ul> \
							<li> \
								<a href='#'>Read more</a> \
							</li> \
						</ul> \
					</div> \
			</div> \
		 </div>";
	},

	getTemplate: function(){
		return this.template;
	}
});

var SpyCard = PlayersCard.extend({

	template: undefined,

	init: function(){
		this._super("Spia", "Ruba una carta bonus ad un tuo avversario!");
		this.interactMessage= "Seleziona l'utente a cui vuoi rubare una carta bonus...";
		this.applyOnAllRound = false;
        this.type = SPY_CARD;
		this.canInteract = true;
		this.classCard = "ca-item-image-spy";
		this.action = "socket.emit('spy', { \
			sessionId: sessionId, \
			matchId: matchId, \
			playerId: playerId \
		});";
		this.sound = "sm.play('spy');";
		this.template = "<div class='ca-item'> \
			<div class='ca-item-back-color ca-item-back-green'> \
			</div> \
			<div class='ca-item-main' card='"+this.id+"'> \
				<h3>"+this.title+"</h3> \
				<div class='ca-item-image "+this.classCard+"'></div> \
				<h4> \
					<span class='ca-quote'>&ldquo;</span> \
					<span>"+this.description+"</span> \
				</h4> \
				<div class='ca-item-help'></div> \
			</div> \
			<div class='ca-content-wrapper'> \
					<div class='ca-content'> \
						<h6>Spiegazione della carta</h6> \
						<a href='#' class='ca-close'>close</a> \
						<div class='ca-content-text'> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
						</div> \
						<ul> \
							<li> \
								<a href='#'>Read more</a> \
							</li> \
						</ul> \
					</div> \
			</div> \
		 </div>";
	},

  getTemplate: function(){
	return this.template;
	}
});

var Epidemia = PlayersCard.extend({

	template: undefined,

	init: function(){
		this._super("Epidemia", "Provoca un'epidemia di colera alle truppe di un tuo avversario: ogni suo territorio perder&agrave; il 30% delle truppe!", 1, -1);
		this.interactMessage= "Seleziona l'utente a cui applicare la carta Epidemia";
		this.applyOnAllRound = false;
        this.type = EPIDEMIA;
		this.classCard = "ca-item-image-epidemia";
		this.action = "socket.emit('epidemia', { \
			sessionId: sessionId, \
			matchId: matchId, \
			playerId: playerId \
		});";
		this.template = "<div class='ca-item'> \
			<div class='ca-item-back-color ca-item-back-red'> \
			</div> \
			<div class='ca-item-main' card='"+this.id+"'> \
				<h3>"+this.title+"</h3> \
				<div class='ca-item-image "+this.classCard+"'></div> \
				<h4> \
					<span class='ca-quote'>&ldquo;</span> \
					<span>"+this.description+"</span> \
				</h4> \
				<div class='ca-item-help'></div> \
			</div> \
			<div class='ca-content-wrapper'> \
					<div class='ca-content'> \
						<h6>Spiegazione della carta</h6> \
						<a href='#' class='ca-close'>close</a> \
						<div class='ca-content-text'> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
							<p>testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo testo </p> \
						</div> \
						<ul> \
							<li> \
								<a href='#'>Read more</a> \
							</li> \
						</ul> \
					</div> \
			</div> \
		 </div>";
	},

  getTemplate: function(){
	return this.template;
	}
});


exports.CardBonusDeck = CardBonusDeck;

exports.AtomicBombCard = AtomicBombCard;
exports.DefensiveCard = DefensiveCard;
exports.OffensiveCard = OffensiveCard;
exports.AllianceCard = AllianceCard;
exports.AirAttack = AirAttack;
exports.GroundAttack = GroundAttack;
exports.DistanceAttack = DistanceAttack;
exports.SingleReinforcement = SingleReinforcement;
exports.DoubleReinforcement = DoubleReinforcement;
exports.TripleReinforcement = TripleReinforcement;
exports.SabotageCard = SabotageCard;
exports.SpyCard = SpyCard;
exports.DicesCard = DicesCard;
exports.TroupesCard = TroupesCard;
exports.PlayersCard = PlayersCard;
exports.Epidemia = Epidemia;

exports.EPIDEMIA = EPIDEMIA;
exports.ATOMIC_BOMB_CARD = ATOMIC_BOMB_CARD;
exports.DEFENSIVE_CARD = DEFENSIVE_CARD;
exports.OFFENSIVE_CARD = OFFENSIVE_CARD;
exports.ALLIANCE_CARD = ALLIANCE_CARD;
exports.AIR_ATTACK = AIR_ATTACK;
exports.GROUND_ATTACK = GROUND_ATTACK;
exports.DISTANCE_ATTACK = DISTANCE_ATTACK;
exports.SINGLE_REIFORCEMENT = SINGLE_REINFORCEMENT;
exports.DOUBLE_REIFORCEMENT = DOUBLE_REINFORCEMENT;
exports.TRIPLE_REIFORCEMENT = TRIPLE_REINFORCEMENT;
exports.SABOTAGE_CARD = SABOTAGE_CARD;
exports.SPY_CARD = SPY_CARD;