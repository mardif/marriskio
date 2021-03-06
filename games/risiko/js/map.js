/* preload images */
$.fn.preload = function() {
    this.each(function(){
        $('<img/>')[0].src = this;
    });
};
var cacheImages = {};
for(var i=0;i<20;i++){
	createCenterIcon(i,"FF0000");
	createCenterIcon(i,"FFFF00");
	createCenterIcon(i,"dddddd");
};

/*------------------------------------------*/
var gmap;
var polygons = new Array();
var center = new google.maps.LatLng(30,20);
var infowindow;
var markers = [];
var activeStates = [];
var turnEnable = false;
var contatoreTurni = -1;
var statoTurno = -1;
var truppeRimanenti = -1;
var truppeToAddPerTurno = -1;
var nemiciConfinanti = undefined;
var nemiciConfinantiAlleati = undefined;
var attackFrom = undefined;
var offenderName = undefined;
var moveFrom = undefined;
var moveTo = undefined;
var movementOpen = false;
var continents = {};
var images = ["/left","/right","/up","/down","/users","/notes","/dices","/dice1","/dice2","/dice3","/dice4","/dice5","/dice6","/dice1r","/dice2r","/dice3r","/dice4r","/dice5r","/dice6r","/dice1g","/dice2g","/dice3g","/dice4g","/dice5g","/dice6g", "/arrow", "/arrow2", "/arrow3", "/arrow4"];
$(images).preload();
var lastCenter = center;
var nick;
var mycolor;
var AIActivated = false;
var isItMyTurn = false;

MyOverlay.prototype = new google.maps.OverlayView();
MyOverlay.prototype.onAdd = function() { }
MyOverlay.prototype.onRemove = function() { }
MyOverlay.prototype.draw = function() { }
function MyOverlay(map) {
	this.setMap(map);
}

var troupesToAdd = {};

var overlay;
var projection;
var interactCardSet = undefined;

/*
SOCKETS
*/
var socket = io.connect(location.protocol+'//'+location.host, {'sync disconnect on unload': true });
//var sessionId = null;
//var matchId = null;
var myStates = [];

/* SOCKET EVENTS */

// matchId e sessionId vengono impostate dal framework nella map.html tramite swig

socket.emit("firstConnect", {matchId: matchId});

socket.on("errorOnAction", function(data){
	show_note({type: data.level, message: data.message, delay:data.delay});
	if ( data.action ){
		try{
			eval(data.action);
		}
		catch(e){console.log("action non valida: "+data.action);}
	}
});

socket.on("playerUsesBonusCard", function(data){
	if ( data.sessionId == sessionId && data.matchId == matchId ){
		$("#deck").hide();


		if ( data.card.canInteract ){
			$("#cards").hide();
			var message = data.card.interactMessage ? data.card.interactMessage : "";
			interactCardSet = data.card;
			if ( data.card.interactiveWith == "PLAYERS" ){
				maximizeUsers();
			}
			message += "<br/><input type='button' value='Annulla uso carta' id='annullaCartaMarker'>";
			$("#stepStatus").html(  message );
		}
	}
	if ( data.card.canInteract == undefined || data.card.canInteract == false ){
		if ( data.sessionId == sessionId && data.matchId == matchId ){
			//sendToChat("Ho utilizzato la carta "+data.card.title, {type:"info"});
			show_note({type:"info", message: "<strong>Hai utilizzato la carta "+data.card.title+"</strong>"});
		}
		else{
		    show_note({type:"info", message:"<strong>Il generale "+data.nick+" ha utilizzato la carta "+data.card.title+"<br/><a href='javascript:void(0);' class='card' id='"+data.card.id+"'>Cosa significa?</a></strong>", notblocking:false});
		}

		try{
			eval(data.card.sound);
		}
		catch(e){}
	}
});

socket.on("receiveMyBonyusCard", function(data){
	$("#deck > .ca-wrapper").empty();
	for(i in data.cards){
		var card = data.cards[i];
		addCardToDeck("#deck", card);
	}
	$('#deck').contentcarousel();
	$("#deck").draggable({
		'cursor': 'move'
	});
	$("#deck").fadeIn(300);

});

socket.on("receiveCardForHelp", function(data){
	$("#deckhelp > .ca-wrapper").empty();
	for(i in data.cards){
		var card = data.cards[i];
		addCardToDeck("#deckhelp", card);
	}
	$('#deckhelp').contentcarousel();
	$("#deckhelp").draggable({
		'cursor': 'move'
	});
	$("#deckhelp").fadeIn(300);
});

socket.on("joinUser", function(data){
    fillJoinUsers(data);
});
socket.on("getSessionId", function(data){
    //sessionId = data.sessionId;
	//matchId = data.matchId;
});
socket.on("highlightStatiConfinanti", function(obj){
    var stato  = obj.id;
    nemiciConfinanti = obj.confini.confini;
	nemiciConfinantiAlleati = obj.confini.confiniAlleati;
	attackFrom = obj.attackFrom;
	offenderName = obj.offenderName;
	moveFrom = obj.moveFrom;
    var oldActiveStates = obj.oldActiveStates;

	var marker = getMarker(stato);
    for(var i in oldActiveStates){
        getPolygon(oldActiveStates[i]).setOptions( resetPolygonOption );
		var m = getMarker(oldActiveStates[i]);
		m.setOptions({icon: createCenterIcon(m.troupes, "dddddd").mainIcon});
    }

    activeStates.push(stato);

    getPolygon(stato).setOptions({
        strokeColor: "#000000"
    });

	marker.setOptions({
		icon: createCenterIcon(marker.troupes, "FF0000").mainIcon
	});

    for(var j in nemiciConfinanti){
        activeStates.push(nemiciConfinanti[j]);
        getPolygon(nemiciConfinanti[j]).setOptions({
            strokeColor: "#000000",
            strokeWeight: 3,
            fillOpacity: 1
        });
		var m = getMarker(nemiciConfinanti[j]);
		m.setOptions({
			icon: createCenterIcon(m.troupes, "FFFF00").mainIcon
		});
    }

    for(var j in nemiciConfinantiAlleati){
        activeStates.push(nemiciConfinantiAlleati[j]);
        getPolygon(nemiciConfinantiAlleati[j]).setOptions({
            strokeColor: "#000000",
            strokeWeight: 3,
            fillOpacity: 1,
			fillColor: "#000000"
        });
		var m = getMarker(nemiciConfinantiAlleati[j]);
		m.setOptions({
			icon: createCenterIcon(m.troupes, "FFFF00").mainIcon
		});
    }

    //$("#offenderName").html(obj.offenderName);
    //$("#actionStatus").html(obj.offenderName+" attacca.... ");

});

socket.on("showDices", function(data){
	hideDices();
	var m = getMarker(data.state);
	showArrow(projection.fromLatLngToContainerPixel(m.getPosition()));
	if ( data && data.sessionId == sessionId ){
		sendToChat("Attacco "+data.defenderName+" da "+offenderName, {type:"info"});
	}
	else{
		show_note({type:"info", message:"Attacco "+data.defenderName+" da "+offenderName});
	}
	showDices("<img src='/dices' border='0'/>");
});

socket.on("buildEntireMap", function(data){
    myStates = [];
    $("#remoteMouse").hide();
    if ( data ){
		var engineLoaded = data.engineLoaded;
		var players = data.stati;
		var turno = data.turno;
		var amIMaster = false;
		isItMyTurn = sessionId == turno.session.id;
        
    for(var prp in players){
      var color = players[prp].color;
      var states = players[prp].states;
      var isMaster = players[prp].master;
      var old_num_cards = $("#num_cards").html();
      var num_cards = players[prp].cards.length;
      var scudo = players[prp].haveDefensiveCard;
      if ( scudo ){
      	if ( $("#elenco li[id='"+prp+"'] img.scudo").length == 0 ){
          $("#elenco li[id='"+prp+"']").append("<img src='/scudo' height='18' class='scudo' border='0'>");
        }
      }
      else{
        $("#elenco li[id='"+prp+"'] img.scudo").remove();
      }


      troupesToAdd = {};
      
      if ( prp == sessionId ){
	    $("#num_cards").attr("title", num_cards == 0 ? "Non hai alcuna carta giocabile" : ( num_cards == 1 ? "Hai una carta nel tuo mazzo" : "Hai "+num_cards+" carte nel tuo mazzo" ) ).html(num_cards);
	    if ( old_num_cards != num_cards ){
	    	$("#cards").parent().animate({ opacity: 0}, 500).animate({ opacity: 1}, 500).animate({ opacity: 0}, 500).animate({ opacity: 1}, 500).animate({ opacity: 0}, 500).animate({ opacity: 1}, 500);
	    }
      	mycolor = color;
        $("#actions, #users, #chat").css("border-color", color);
        truppeRimanenti = players[prp].initialTroupes;
        truppeToAddPerTurno = players[prp].troupeToAdd;
        amIMaster = players[prp].master;
        nick = players[prp].nick;
        interactCardSet = players[prp].interactiveCard;
        AIActivated = players[prp].AIActivated;
      }
      for(var i in states){
        var stato = states[i];
        if ( prp == sessionId ){
            myStates.push(stato);
        }
        getPolygon(stato.id).setOptions({
          fillColor: color,
          fillOpacity: 0.5,
          strokeColor: "#FFFFFF",
          strokeOpacity: 1,
          strokeWeight: 2
        });
        var m = getMarker(stato.id);
        m.troupes = stato.troupes;
        m.setOptions({
            map: gmap,
            icon: createCenterIcon(stato.troupes, "dddddd").mainIcon
        });
      }
      
      if ( engineLoaded == false && isMaster && prp == sessionId && $("#elenco li").size() == data.num_players ){
        $("#makeWorld").css("display", "inline-block");
      }
      else if ( engineLoaded && prp == sessionId ){
        $("#makeWorld").css("display", "none");
      }
    }
    
    if ( AIActivated === true ){
        $("#buttonbar").hide();
    }
    
        if ( data.gameEnd === true ){
            $("#stepStatus").html("<h1>VITTORIA!!!!<br/>Il generale "+data.nick+" è riuscito a vincere la partita... COMPLIMENTI!</h1>");
            $("#buttonbar").hide();
            return;
        }

		if ( !turno.session ){
			var msg = "Attendi gli altri giocatori";
			if ( amIMaster && $("#elenco li").size() == data.num_players ){
				msg += " e clicca il pulsante \"Crea Mondo\"";
			}
			else{
				msg += " ...";
			}
			$("#stepStatus").html(msg);
			return;
		}
        
        if ( $("#elenco li").size() < data.num_players ){
            //in attesa che tutti i giocatori siano online!
            $("#stepStatus").html("Attendi gli altri giocatori");
            return;
        }

		checkTurn(turno);
        
    }
});

socket.on("initialTroupAdded", function(data){
	if ( data ){
		var m = getMarker(data.statoId);
		if ( m ){
			m.setOptions({
				icon: createCenterIcon(data.troupes).mainIcon
			});
		}

		if ( data.sessionId == sessionId ) {
			truppeRimanenti = data.troupesRemaining;
			if ( truppeRimanenti > 0 ){
				$("#stepStatus").html("Rafforza i tuoi territori con "+truppeRimanenti+" armate");
			}
			else{
				$("#stepStatus").html("Rafforzamento completato! Ottimo lavoro... ora attendi che gli avversari siano pronti!<br/>Riceverai un'email di notifica quando sarà di nuovo il tuo turno!");
			}
		}

		/*
		    data.initialTurnFinished
			indica la fine del turno di rafforzamento iniziale,
			 ma per l'invio email mi devo basare, oltre a questo flag, anche dell'utente che ha terminato la fase
			 in modo da inviare una sola email di avvertimento agli utenti, per questo: initialTurnFinished: data.sessionId == sessionId
		*/
		if ( data.initialTurnFinished ){
			socket.emit("getActualWorld", {nextStep: false, matchId: matchId, sessionId: sessionId, initialTurnFinished: data.sessionId == sessionId});
		}
	}
});

socket.on("troupAddedOnTurn", function(data){

	if ( data && data.mapping ){
		for(statoId in data.mapping){
			var m = getMarker(statoId);
			m.setAnimation(google.maps.Animation.BOUNCE);
			setTimeout(function(){
				m.setAnimation(null);
			}, 1500);
		}
	}

	if ( data && data.sessionId == sessionId ){
		setTimeout(function(){
			socket.emit("getActualWorld", {nextStep: true, matchId: matchId, sessionId: sessionId});
		}, 1500);
	}
	/*
	if ( data ){
		var m = getMarker(data.statoId);
		if ( m ){
			m.setOptions({
				icon: createCenterIcon(data.troupes).mainIcon
			});
		}

		if ( data.sessionId == sessionId ) {
			truppeToAddPerTurno = data.troupesRemaining;
		}

		if ( data.troupesFinished == false ){
			$("#stepStatus").html(data.msg);
		}
		else{
			$("#stepStatus").html("Grande! Hai terminato la fase di rafforzamento!");
		}

		if ( data.troupesFinished ){
			socket.emit("getActualWorld", {nextStep: data.sessionId == sessionId, matchId: matchId});
		}
	}
	*/
});

socket.on("attackResults", function(data){
	if ( data ){
		if ( data.error && data.sessionId == sessionId ){
            show_note({type:"error", message:data.error});
			return;
		}

		/* visualizzo il risultato dei dadi */
		var content = "<table><tr><th>Offender</th><th>Defender</th></tr>";
		var off = data.offender.dadi;
		var def = data.defender.dadi;
		var dadiValidi = data.associazioni;

		for(var i=0; i< Math.max(off.length, def.length); i++){
			var resOff = off[i];
			var resDef = def[i];
			var offenderStatus = "r";
			var defenderStatus = "g";
			if ( off[i] > def[i] ){
				offenderStatus = "g";
				defenderStatus = "r";
			}
			else{
				if ( off[i] == undefined || def[i] == undefined ){
					offenderStatus = "";
					defenderStatus = "";
				}
			}

			if ( i > (dadiValidi-1) ){ //il -1 vale solo perche dentro un ciclo di array 0-based
				offenderStatus = "";
				defenderStatus = "";
			}

			content += "<tr><td>"+(off[i] ? "<img border='0' src='/dice"+resOff+offenderStatus+"'/>" : "&nbsp;" )+"</td><td>"+(def[i] ? "<img border='0' src='dice"+resDef+defenderStatus+"'/>" : "&nbsp;")+"</td></tr>";
		}
		content += "</table>";
		showDices(content);

		setTimeout(function(){
			if ( $("#dices").is(":visible") ){
				hideDices();
			}
		}, 2000);

		if ( data.isConquistato == true ){

			var offenderTroupes = data.offender.troupes;

			if ( data.sessionId == sessionId ){
				sendToChat("Ho conquistato "+data.defenderName+"!!!", {type:"info"});
			}
			else{
				show_note({type:"info", message:data.defenderName+" conquistato!"});
			}

			socket.emit("getActualWorld", {nextStep: false, matchId: matchId, sessionId: sessionId});

			if ( data.sessionId == sessionId && offenderTroupes > 1 && data.haveWeAWinner != true ){
				show_infoWindow(data.offender.statoId, data.defender.statoId);
			}

		}
		else{

			var offender = getMarker(data.offender.statoId);
			var defender = getMarker(data.defender.statoId);
			offender.troupes = data.offender.troupes;
			defender.troupes = data.defender.troupes;
			offender.setOptions({
				icon: createCenterIcon(data.offender.troupes, "FF0000").mainIcon
			});
			defender.setOptions({
				icon: createCenterIcon(data.defender.troupes, "FFFF00").mainIcon
			});
		}

		//$("#actionStatus").html("");
	}
});

socket.on("broadcastChat", function(data){
	if ( data ){
		var fontproperties="font-style:normal;font-weight:bold";
		if (data.isStatusMessage)
			fontproperties="font-style:italic";
		var msg = $("<span style='display:none;width:100%;"+fontproperties+";float:left;color:"+data.color+"'>"+data.nick+": "+data.msg+"</span>");
		msg.prependTo($("#buffer"));
		msg.fadeIn(300, function(){
			sm.play("bell");
		});
	}
});

socket.on("notifyUserTurn", function(data){
	if ( data.nick == nick ) {
	    $("title").html("E' il tuo turno!");
    }
    else{
    	$("title").html("Attendi gli altri giocatori...");
    }
});

socket.on("WeHaveAWinner", function(data){
    if ( data && data.winner ){
        show_note({type:"info", message:"VITTORIA!!!!<br/>Il generale "+data.nick+" è riuscito a vincere la partita... COMPLIMENTI!", delay:10000});
        $("#stepStatus").html("<h1>VITTORIA!!!!<br/>Il generale "+data.nick+" è riuscito a vincere la partita... COMPLIMENTI!</h1>");
    }
});

socket.on("resultMoveTroupesTo", function(data){
	if ( data ){

		resetActiveStates(data.statoFrom.id, data.statoTo.id);

		var statoFrom = getMarker(data.statoFrom.id);
		if ( statoFrom ){
			statoFrom.setOptions({
				icon: createCenterIcon(data.statoFrom.troupes, "FF0000").mainIcon
			});
			statoFrom.troupes = data.statoFrom.troupes;
		}

		var statoTo = getMarker(data.statoTo.id);
		if ( statoTo ){
			statoTo.setOptions({
				icon: createCenterIcon(data.statoTo.troupes, "FFFF00").mainIcon
			});
			statoTo.troupes = data.statoTo.troupes;
		}

		if ( data.error && data.sessionId === sessionId ){
            show_note({type:"error", message:data.error});
			if ( data.closePopup && movementOpen == true ){
				infowindow.close();
			}
			return;
		}


	}
});

socket.on("returnStatesMap", function(data){
	continents = data;
});

var zoomFromRemote = false;
socket.on("setZoom", function(data){
    zoomFromRemote = true;
    gmap.setZoom(data.zoomLevel);
});
socket.on("impostaCentroMappa", function(data){
    gmap.setCenter(new google.maps.LatLng(data.center.lat, data.center.lng));
});

socket.on('reconnecting', function () {
    show_note({type:"warn", message:"Attempting to reconnect with the server", delay:1000});
    $("#elenco li[id='"+sessionId+"']").removeClass("user-active").addClass("user-inactive");
});

socket.on('reconnect', function () {
    show_note({type:"warn", message:"Successfully reconnected to the server", delay:1000});
    $("#elenco li[id='"+sessionId+"']").removeClass("user-inactive").addClass("user-active");
});

socket.on('reconnect_failed', function () {
    show_note({type:"warn", message:"Reconnection failed! Please, check your internet connection!", delay:3000});
    $("#elenco li[id='"+sessionId+"']").removeClass("user-active").addClass("user-inactive");
});

socket.on('error', function () {
    show_note({type:"error", message:"An unbelievable error occurs! Please, close this page and return to your account page!", delay:10000});
    $("#elenco li[id='"+sessionId+"']").removeClass("user-active").addClass("user-inactive");
});

socket.on('connect', function () {
    show_note({type:"info", message:"Connected successfully to server... Enjoy!"});
    $("#elenco li[id='"+sessionId+"']").removeClass("user-inactive").addClass("user-active");
});

socket.on('connecting', function () {
    show_note({type:"info", message:"Connecting to server... wait please!"});
    $("#elenco li[id='"+sessionId+"']").removeClass("user-active").addClass("user-inactive");
});

socket.on('disconnect', function () {
    show_note({type:"warn", message:"Disconnected from server... please check your internet connection!", delay:3000});
    $("#elenco li[id='"+sessionId+"']").removeClass("user-active").addClass("user-inactive");
});

socket.on('connect_failed', function () {
    show_note({type:"error", message:"Connection to server failed... please check your internet connection!", delay:3000});
    $("#elenco li[id='"+sessionId+"']").removeClass("user-active").addClass("user-inactive");
});

socket.on("sentMousePosition", function(data){
	if ( data && !isItMyTurn ){
		$("#remoteMouse").show();
		var position = projection.fromLatLngToContainerPixel(new google.maps.LatLng(data.lat, data.lng));
		$("#remoteMouse").offset({top: position.y, left: position.x});
	}
});

/* SOCKET EVENTS END */

function showArrow(screenPosition){
	//console.log("screenPosition top:"+screenPosition.y+" left: "+screenPosition.x);
	$("#arrow").css("top", (screenPosition.y-60)+"px").css("left", (screenPosition.x-40)+"px").fadeIn('fast').delay(1000).fadeOut("fast");
}

function showDices(content){
	if ( $("#dices").is(":visible") == false ){
		$("#dices").show().animate({
			top: '+=192'
		}, 1000, function(content){
			$("#dices").append(content);
		}(content));
	}
	else{
		$("#dices").html(content);
	}
}

function hideDices(){
	$("#dices").hide();
	$("#dices").html("");
	$("#dices").css("top", "-120px");
}

function toggleMovement(content){
	if ( movementOpen == false ){
		$("#movement").animate({
			top: '+=300'
		}, 500, function(content){
			$("#movement").append(content);
			movementOpen = true;
			showLocker();
		}(content));
	}
	else{
		$("#movement").animate({
			top: '-=300'
		}, 500, function(content){
			$("#movement").html("");
			movementOpen = false;
			hideLocker();
		});
	}
}

function showLocker(content){
	$("#locker").show();
}

function hideLocker(){
	$("#locker").hide();
}

function moveTroupToStateConquered(statoFrom, statoTo, revert){
	//Sbianco tutti gli stati confinanti che ho reso attivi per visualizzare gli stati dove � possibile effettuare uno spostamento
	//resetActiveStates();
	socket.emit("moveTroupToStateConquered", {
		statoFrom: statoFrom,
		statoTo: statoTo,
		sessionId: sessionId,
		matchId: matchId,
		revert: revert
	});
}

function resetActiveStates(except1, except2){
	for(var i in activeStates){
		if ( activeStates[i] == except1 || activeStates[i] == except2 ){
			continue;
		}
		var m = getMarker(activeStates[i]);
		m.setOptions({
			icon: createCenterIcon(m.troupes, "dddddd").mainIcon
		});
		var p = getPolygon(activeStates[i]);
		p.setOptions(resetPolygonOption);
	}
}

function moveTroupTo(statoFrom, statoTo){
	//Sbianco tutti gli stati confinanti che ho reso attivi per visualizzare gli stati dove � possibile effettuare uno spostamento
	//resetActiveStates();
	socket.emit("moveTroupTo", {
		statoFrom: statoFrom,
		statoTo: statoTo,
		sessionId: sessionId,
		matchId: matchId
	});
}


function checkTurn(turno){

	contatoreTurni = turno.contatoreTurni;
	statoTurno = turno.stepTurno;
	truppeToAddPerTurno = turno.troupesToPlace;

	$("#elenco li").css("font-size", "14px").css("font-weight", "normal");
	
	// Per prima cosa abilito/disabilito gli eventi delle mappe e delle azioni
	if ( contatoreTurni > 0 ){
		if ( turno.session.id === sessionId ){
			turnEnable = true;
			//gmap.setOptions({draggable: true});
		}
		else{
			turnEnable = false;
			//gmap.setOptions({draggable: false});
		}
	}

	$("#elenco li[id='"+turno.session.id+"']").css("font-size", "24px").css("font-weight", "bold");
	socket.emit("changeActivePlayer",{
		sessionId: sessionId,
		nick: turno.session.nick
	});
	var status = "";
	if ( contatoreTurni == 0 && truppeRimanenti > 0 ){
		status = "Rafforza i tuoi territori con "+truppeRimanenti+" armate";
	}
	else if ( contatoreTurni == 0 && truppeRimanenti === 0 ){
		status = "Rafforzamento completato! Ottimo lavoro... ora attendi che gli avversari siano pronti!<br/>Riceverai un'email di notifica quando sarà di nuovo il tuo turno!";
	}
	else if ( contatoreTurni > 0 ){
		if ( turno.stepTurno == 0 ){
			status = "Generale "+turno.session.nick+", "+(turno.sabotaged == true ? "sei stato <strong>SABOTATO</strong>," : "")+"posiziona "+turno.troupesToPlace+" armate sui tuoi territori!";
			if ( turno.sessionId === sessionId ){
				status += "<br/><input type='button' value='annulla posizionamento truppe' id='annullaPosTroupes'>";
			}
		}
		else if ( turno.stepTurno == 1 ){
			status = "Generale "+turno.session.nick+" e' il momento di attaccare!<br/>Clicca sul tuo stato da cui vuoi attaccare e successivamente sullo stato avversario confinante";
			if ( turno.session.id === sessionId ){
				status += "<br/><span style='font-size:9pt;'>Quando hai terminato, clicca <input type='button' value='Termina attacco' id='stepForward'></span>";
			}
		}
		else if ( turno.stepTurno == 2 ){
			status = "Generale "+turno.session.nick+", puoi effettuare uno spostamento!";
			if ( turno.session.id === sessionId ){
				$("#cards").hide();
				status += "<br/><span style='font-size:8pt;'>Quando hai terminato, clicca <input type='button' value='Termina turno' id='stepForward'></span>";
				status += "<span style='font-size:8pt;'> oppure <input type='button' value='Torna alla fase di attacco' id='prevStep'> *<span style='font-color:red;'>solo se non hai fatto lo spostamento!</span></span>";
			}
		}

	}
	$("#stepStatus").html(status);

	/*
	 * Controllo della presenza di un'eventuale carta bonus interattiva giocata ma non ancora utilizzata
	 */
	if( interactCardSet ){
		if ( interactCardSet.canInteract ){
			$("#stepStatus").html( interactCardSet.interactMessage ? interactCardSet.interactMessage : "----");
			if ( interactCardSet.interactiveWith == "PLAYERS" ){
				maximizeUsers();
			}
			else if (interactCardSet.interactiveWith == "MARKERS"){
				var message = interactCardSet.interactMessage ? interactCardSet.interactMessage : "";
				message += "<br/><input type='button' value='Annulla uso carta' id='annullaCartaMarker'>";
				$("#stepStatus").html(  message );
			}
		}

	}
	else{
		$("#cards").show();
	}

	if ( turno.cardMessage ){
		if ( turno.sound ){
			try{
				eval(turno.sound);
			}catch(e){}
		}
		var m = getMarker(turno.cardStatoId);
		if ( turno.session.id == sessionId ){
			sendToChat(turno.cardMessage+ (m ? " ("+m.title+")" : ""));
		}
		/*$("#cardStatus").html*/show_note({type:"info", message:"<strong>"+turno.cardMessage+"</strong>"});
		/*
		setTimeout(function(){
			$("#cardStatus").html("");
		}, 5000);
		*/
		if ( turno.cardStatoId ){
			m.setAnimation(google.maps.Animation.BOUNCE);
			setTimeout(function(){
				m.setAnimation(null);
			}, 1500);
		}
	}

}

function fillJoinUsers(data){
  
    if ( data && data.users ){
      var masterSession;
        $("#elenco li").remove();
        for(var i in data.users){
            var user = data.users[i];
            if ( user.master === true ){
              masterSession = user;
            }
            
            $("<li id='"+user.id+"' class='user-"+(user.statusActive ? "active" : "inactive")+"' style='background-color:"+user.color+"'><img src='/"+(user.AIActivated ? "bug" : "user")+"' title='"+(user.AIActivated ? "Il generale "+user.nick+" ha abbandonato la partita! Il sistema gestirà le sue truppe solo per la difesa!" : "Generale "+user.nick+" online e pronto a combattere!")+"' border='0'><span>"+user.nick+"</span><span style='float:right;'><img title='"+(user.statusActive ? "Connesso! Pronto per giocare!" : "Non connesso")+"' src='/"+(user.statusActive ? "connected" : "disconnected")+"'></span></li>").appendTo($("#elenco"));;
            
        }
        /*
        if ( data.engineLoaded === false ){
          if ( masterSession && masterSession.id == sessionId && data.users.length == data.num_players ){
            $("#makeWorld").css("display", "inline-block");
            $("#stepStatus").html("Siete tutti online! Ora puoi cliccare sul pulsante \"Crea Mondo\"");
          }
          else{
            if ( data.users.length == data.num_players ){
              $("#stepStatus").html("Tutti i giocatori sono online! Resta in attesa ...");
            }
            $("#makeWorld").css("display", "none");
          }
        }
        */
        
        /*
        if ( data.gameEnd === true ){
            $("#stepStatus").html("<h1>VITTORIA!!!!<br/>Il generale "+data.winner.nick+" è riuscito a vincere la partita... COMPLIMENTI!</h1>");
            $("#buttonbar").hide();
            return;
        }
        */
        
    }
}

function isMyState(statoId){
    for(var i in myStates){
        if ( myStates[i].id == statoId ){
            return true;
        }
    }
    return false;
}

function isStatoConfinante(statoId){
	for(var i in nemiciConfinanti){
		if ( nemiciConfinanti[i] == statoId ){
			return true;
		}
	}
	for(var i in nemiciConfinantiAlleati){
		if ( nemiciConfinantiAlleati[i] == statoId ){
            show_note({type:"error", message:"Non puoi attaccarlo: hai stretto un'alleanza con questo giocatore!"});
			return false;
		}
	}
	return false;
}

function show_infoWindow(offenderId, defenderId){

	var old_zoom = gmap.getZoom();
	var old_center = gmap.getCenter();

	var MBR = new google.maps.LatLngBounds();
	MBR.extend(getMarker(offenderId).getPosition());
	MBR.extend(getMarker(defenderId).getPosition());

	gmap.setCenter(MBR.getCenter());
    gmap.fitBounds(MBR);

	var footer = $("#moveTroupes .modal-footer");
	footer.children().remove();
	var back = $("<a href='javascript:void(0);' class='btn btn-mini' style='margin:0 20px;border:1px solid black;' onClick='moveTroupToStateConquered("+offenderId+", "+defenderId+", true);' title='Ogni click riporti indietro una truppa dal territorio conquistato!'><img src='/user_remove' border='0'></a>");
	back.appendTo(footer);

	var move = $("<a href='javascript:void(0);' class='btn btn-mini' style='margin-right:20px;border:1px solid black;' onClick='moveTroupToStateConquered("+offenderId+", "+defenderId+");' title='Ogni click sposti una truppa nel territorio conquistato!'><img src='/user_add' border='0'></a>");
	move.appendTo(footer);

	$("<a href='javascript:void(0);' data-dismiss='modal' class='btn btn-success btn-large'>Termina spostamento</a>").appendTo(footer);

	var d = $("#moveTroupes").modal('show');

	d.unbind("hidden.bs.modal").bind("hidden.bs.modal", function(e){
		gmap.setZoom(old_zoom);
		gmap.setCenter(old_center);
	});

}

$(document).on("click", "#makeWorld", function(){
	socket.emit("caricaStati", {matchId: matchId, sessionId:sessionId});
	truppeRimanenti = 1;
});

$(document).on("click", "#stepForward", function(){
	hideDices();
	socket.emit("getActualWorld", {nextStep: true, matchId: matchId, sessionId: sessionId});
});

$(document).on("click", "#deckhelp DIV.ca-item-help", function(){
	$(this).hide();
});

$(document).on("click", "#deckhelp DIV.ca-item-image", function(){
	$(this).siblings(".ca-item-help").click();
});

$(document).on("click", "#btnCardList", function(){
	socket.emit("getCardForHelp", {matchId: matchId});
});

var statesSelected = [];

$(document).on("mouseenter", "DIV.continent", function(){
	var continent = $(this).attr("id");
	for(s in continents[continent].states){
		var stato = continents[continent].states[s];
		for(p in polygons){
			var po = polygons[p];
			if ( po.id == stato ){
				statesSelected.push(po);
				po.originalColor = po.fillColor;
				po.setOptions(redPolygonOption);
			}
		}
	}
});
$(document).on("mouseleave", "DIV.continent", function(){
	for(s in statesSelected){
		var so = statesSelected[s];
		var rpo = $.extend({}, resetPolygonOption);
		rpo.fillColor = so.originalColor;
		so.setOptions(rpo);
	}
	statesSelected = [];
});

$(document).on("click", "#cards", function(){
	socket.emit("getMyBonusCard", {
		sessionId: sessionId,
		matchId: matchId
	});
});

$(document).on("click", "#help", function(){
    intro.start();
});

$(document).on("click", "#abbandonaMatch", function(){
    var response = confirm("Sicuro di voler abbandonare la partita? Non potrai più rientrare ed il tuo posto verrà preso dal computer!");
    if ( response === true ){
        socket.emit("abandonMatch", {
            sessionId: sessionId,
            matchId: matchId
        });
    }
});

$(document).on("click", "#prevStep", function(){
	socket.emit("getActualWorld", {nextStep: false, matchId: matchId, prevStep: true, sessionId: sessionId});
});

$(document).on("click", "#deck DIV.ca-item-image", function(){
	socket.emit("useCardBonus", {
		sessionId: sessionId,
		matchId: matchId,
		cardId: $(this).parent().attr("card")
	});
});

$(document).on("click", "#annullaPosTroupes", function(){
	troupesToAdd = {};
	socket.emit("getActualWorld", {nextStep: false, matchId: matchId, prevStep: false, sessionId: sessionId});
});

$(document).on("click", "#annullaCartaMarker", function(){
	socket.emit("cancelBonusCardAction", {sessionId: sessionId, matchId: matchId});
});

$(document).on("click", "#deck .ca-close-main, #deckhelp .ca-close-main", function(){
	$(this).parent().parent().fadeOut(300);
});

var addCardToDeck = function(selector, card){
	$(selector+" > .ca-wrapper").append( card.template );
};

var maximizeUsers = function(){
	var newLeft = $("#stepStatus").offset().left - $("#users").offset().left;
	var newWidth = $("#stepStatus").width() - $("#users").width();
	$("#users").append("<div style='width:100%;text-align:center;'><input type='button' id='annullaAzioneCarta' value='Annulla'></div>");
	$("#users li[id='"+sessionId+"']").fadeOut("100");
	$("#users").animate({
		'left': '+='+newLeft +'px',
		'top': '+=30px',
		'width': '+='+newWidth+'px',
		'height': '+=100px'
	}, 500, function(){
		$("#users li").unbind().bind("click", function(){
			var playerId = $(this).attr("id");
			eval(interactCardSet.action);
			minimizeUsers();
		});
		$("#users #annullaAzioneCarta").unbind().bind("click", function(){
			socket.emit("cancelBonusCardAction", {sessionId: sessionId, matchId: matchId});
			minimizeUsers();
		});
	});
}

var minimizeUsers = function(){
	var left = "10px";
	if ( $("#users .head img[src='users']").length > 0 ){
		left = "-200px";
	}
	$("#users li").fadeIn("100");
	$("#users").animate({
		'left': left,
		'top': '-=30px',
		'width': '-='+($("#users").width() - 200)+'px',
		'height': '-=100px'
	}, 500, function(){
		$("#users li").unbind();
		$($("#users #annullaAzioneCarta").unbind().parent()).empty();
	});
};

$(document).ready(function(){
	initializeMap();

	//infowindow = buildNewInfoBubble(gmap);
	//infowindow.hideCloseButton = true;

	/* boh.. non funziona... */
	google.maps.event.addListener(gmap, 'dragstart', function() {
		lastCenter = gmap.getCenter();
	});

	google.maps.event.addListener(gmap, 'dragend', function() {

		if ( /*gmap.getCenter().lng() > 160 ||
			 gmap.getCenter().lng() < -70 ||*/
			 gmap.getCenter().lat() > 70  ||
			 gmap.getCenter().lat() < -10
		){
			gmap.setCenter(lastCenter);
		}
		/*
		if ( contatoreTurni > 0 && turnEnable == true ){
			socket.emit("center_changed", {lat: gmap.getCenter().lat(), lng: gmap.getCenter().lng()});
		}
		*/

	});

	google.maps.event.addListener(gmap, 'idle', function() {
	   // Get projection
	   projection = overlay.getProjection();
	});
	google.maps.event.addListener(gmap, 'projection_changed', function() {
	   // Get projection
	   projection = overlay.getProjection();
	});

	google.maps.event.addListener(gmap, "mousemove", function(event){
		sendMousePosition(event);
	});


    /* Evento pulsante di caricamento stati */
    $("#loadStates").click(function(){
        socket.emit("caricaStati");
    });

	/*
	$("#sendMsg").click(function(){
		if ( $.trim($("#chatMsg").val()) != "" ){
			sendToChat($("#chatMsg").val());
			$("#chatMsg").val("");
		}
	});
*/

	$("#chatMsg").keyup(function(event){
		if(event.keyCode == 13){
			if ( $.trim($(this).val()) != "" ){
				/* distingui i messaggi di chat degli utenti dai messaggi di stato */
				sendToChat($(this).val(), false);
				$(this).val("");
			}
		}
	});

	$("#console div.bandellaButton").click();

	$("#locker").height($(window).height());

	overlay = new MyOverlay(gmap);
	initializeSounds();

});

$(document).on("click", ".bandellaButton", function(){

	var closed = $(this).attr("closed");
	var thisis = $(this);
	if ( closed && closed == "true" ){
		$(this).parent().parent().animate({
				left: '+=210'
			}, 400, function(){
				thisis.find("img").attr("src", "left");
				thisis.animate({right: '0px'}, 200);
				thisis.removeAttr("closed");
			}
		);
	}
	else{
		$(this).parent().parent().animate({
				left: '-=210'
			}, 400, function(){
				var icon = "right";
				var action = {right: '-33px'};
				if ( $(this).attr("id") == "users" ){
					icon = "users";
				}
				else if ( $(this).attr("id") == "console" ){
					icon = "notes";
				}
				else if ( $(this).attr("id") == "actions" ){
					icon = "down";
					action = { top: '50px' };
				}

				thisis.find("img").attr("src", icon);
				thisis.animate(action, 200);
				thisis.attr("closed", "true");
			}
		);
	}

});

$(document).on("click", ".bandellaButtonV", function(){

	var closed = $(this).attr("closed");
	var thisis = $(this);
    var panel = $(this).parent().parent();
	if ( closed && closed == "true" ){
		panel.animate({
				top: '+='+panel.height()
			}, 400, function(){
				thisis.find("img").attr("src", "up");
				thisis.animate({top: '0px'}, 200);
				thisis.removeAttr("closed");
			}
		);
	}
	else{
		panel.animate({
				top: '-='+panel.height()
			}, 400, function(){
				var icon = "down";
				var action = {top: '+='+panel.height()};
                /*
				if ( $(this).attr("id") == "actions" ){
					icon = "down";
					action = { top: '65px' };
				}
                */

				thisis.find("img").attr("src", icon);
				thisis.animate(action, 200);
				thisis.attr("closed", "true");
			}
		);
	}

});

$(document).on('click', ".card", function(){

	var id = $(this).attr("id");
	socket.emit("getCardHelp", {sessionId: sessionId, matchId: matchId, cardId: id});

});

socket.on("receiveCardHelp", function(data){

	if ( data && data.card ){

		$("#helpcard p.lead").empty();
		$("#helpcard p.lead").append( data.card.template );
		$("#helpcard p.lead DIV.ca-item").css("top", "-45px");
		$("#helpcard p.lead").append($("<div style='width:230px;float:left;color:#cacaca;margin:0px;padding:0px;' class='ca-content-text'>"+$("#helpcard p.lead DIV.ca-content-text").html()+"</div>"));
		$("#helpcard p.lead").unbind("click");

		$("#helpcard").modal("show");
	}

});

var initializeSounds = function(){
	window.sm = new SoundEffectManager();
	sm.loadFile('/bell', 'bell', 100);
	sm.loadFile('/spy', 'spy', 100);
	sm.loadFile("/atomicbomb", "atomicbomb", 100);
	sm.loadFile("/cecchinoSound", "cecchino", 100);
	sm.loadFile("/defense", "defense", 100);
	sm.loadFile("/attack", "attack", 100);
	sm.loadFile("/rinforzo", "rinforzo", 100);
	sm.loadFile("/epidemiaSound", "epidemia", 100);
	sm.loadFile("/air", "air", 100);
	sm.loadFile("/attaccoTruppe", "attaccoTruppe", 100);
	sm.loadFile("/sabotage", "sabotage", 100);
	sm.loadFile("/allianceSound", "alliance", 100);
};

function initializeMap() {
    var mapDiv = document.getElementById('map_canvas');
    var defaultOptions = buildDefaultOptions();
    gmap = new google.maps.Map(mapDiv, defaultOptions);

    /*
	var optionLayer = {
		clickable: true,
		preserveViewport: true,
		suppressInfoWindows: true
	};
    */

    /*
    google.maps.event.addListener(gmap, "zoom_changed", function(){
        // gestire i turni!!!

        if ( !zoomFromRemote && turnEnable == true && contatoreTurni > 0 ){
            socket.emit("zoom_changed", gmap.getZoom());
        }
        zoomFromRemote = false;

    });
    */

	retrievePolygons();

}

var resetPolygonOption = {
    clickable: true,
    fillOpacity: 0.5,
    strokeColor: "#FFFFFF",
    strokeOpacity: 1,
    strokeWeight: 2
};

var redPolygonOption = {
	clickable:false,
	fillOpacity: 0.5,
	//fillColor: "#ff0000",
	fillOpacity: 1,
	strokeWidth: 5,
	strokeColor: "#FF0000"
};

var blackPolygonOption = {
	clickable:false,
	fillOpacity: 1,
	fillColor: "#000000",
	fillOpacity: 1,
	strokeWidth: 5,
	strokeColor: "#000000"
};

function buildDefaultOptions() {

   var zoom = 2;
   var defaultOptions = {
						center: center,
						zoom: zoom,
						mapTypeId: google.maps.MapTypeId.ROADMAP,
						disableDoubleClickZoom: true,
						draggable: true,
						keyboardShortcuts: false,
						mapTypeControl: true,
						minZoom: zoom,
						maxZoom: zoom+2,
						overviewMapControl: false,
						panControl: false,
						zoomControl: true,
                        zoomControlOptions: {
                            position: google.maps.ControlPosition.TOP_RIGHT
                        },
						streetViewControl: false,
						rotateControl: false,
						scrollwheel: true
                   };
    return defaultOptions;
}

function retrievePolygons(){

	$.get("/confini", function(data){
		//loop through placemarks tags
		$(data).find("Placemark").each(function(index, value){

			//get coordinates and place name
			var coords = $(this).find("coordinates").text();
			var place = $(this).find("name").text();
            var description = $(this).find("description").text();
            description = description.substring(0, description.length-3);

			//store as JSON
			var coordinates = [];
			coords = coords.split(",0.000000\n")
			$(coords).each(function(idx, el){
				var p = el.split(",");
				lat = $.trim(p[1]);
				lng = $.trim(p[0]);
				if ( lat == 0 && lng == 0 ){
					return true;
				}
				coordinates.push( new google.maps.LatLng(lat, lng) );
			});

			if ( $(this).find("Polygon").length > 0 ){

				var polygon = new google.maps.Polygon(resetPolygonOption);
                polygon.setOptions({paths: coordinates});
				polygon.title = place;
                polygon.id = place;
                polygon.description = description;
				polygon.setMap(gmap);
                polygons.push(polygon);

            	google.maps.event.addListener(polygon, "mousemove", function(event){
					sendMousePosition(event);
				});


			}
			else if ( $(this).find("LineString").length > 0 ){
				var line = new google.maps.Polyline({strokeColor: "#343434", strokeOpacity: 0.5, strokeWeight: 2, path: coordinates});
				line.title = place;
				line.setMap(gmap);
			}
			else if ( $(this).find("Point").length > 0 ){
				var theIcon = createCenterIcon("2", "dddddd");
				var theMarker = new google.maps.Marker({
					position: coordinates[0],
					//map: gmap,
					draggable: false,
					icon: theIcon.mainIcon,
					title:description,
					shadow: theIcon.shadowIcon
				});
                theMarker.id = place;
                theMarker.attackFrom = false;
				theMarker.troupes = 2;
                markers.push(theMarker);

            	google.maps.event.addListener(theMarker, "mousemove", function(event){
					sendMousePosition(event);
				});


				/*
				google.maps.event.addListener(theMarker, 'dblclick', function(){
					if ( contatoreTurni > 0 && turnEnable && isMyState(theMarker.id) && statoTurno == 0 ){
						socket.emit("addTroup", {
							statoId: theMarker.id,
							sessionId: sessionId,
							unit: 10,
							matchId: matchId
						});
					}
				});
				*/

                google.maps.event.addListener(theMarker, 'click', function(event){
                	/*DEBUG*/
                	//showArrow(projection.fromLatLngToDivPixel(this.position));
					//show_infoWindow(this.id, parseInt(this.id)+1);
					/* FINE DEBUG*/
                    
                    if ( data.gameEnd === true || AIActivated === true ){
                        return;
                    }

                	/*
                	 * Gestione delle azioni carte bonus
                	 */
                	if ( contatoreTurni > 0 && turnEnable && ( statoTurno == 1 || statoTurno == 0 ) &&
                		 interactCardSet !== undefined && interactCardSet.canInteract &&
                		 interactCardSet.interactiveWith == "MARKERS" ){
                             
                        if ( (theMarker.troupes + interactCardSet.gapTroupesDefender) < 1 ){
                            var response = confirm("La tua carta azione non sarà pienamente efficace: utilizzandola in questo territorio, riuscirai ad eliminare solo "+ (theMarker.troupes-1)+ " unità nemiche" );
                            if ( response !== true ){
                                return;
                            }
                        }
                             
						try{
							eval(interactCardSet.action);
						}
						catch(e){}

                		 return;
                	}

					if ( contatoreTurni == 0 && isMyState(theMarker.id) && truppeRimanenti > 0 ){
						socket.emit("addInitialTroups", {
							statoId: theMarker.id,
							sessionId: sessionId,
							unit: 1,
							initial: true,
							matchId: matchId
						});
					}
					else if ( contatoreTurni > 0 && turnEnable && isMyState(theMarker.id) && statoTurno == 0 ){
						//non � il turno iniziale, � il mio turno, clicco sul mio stato e lo status �: aggiungi truppe
						if ( troupesToAdd.hasOwnProperty(theMarker.id) ){
							troupesToAdd[theMarker.id] = troupesToAdd[theMarker.id] +1;
						}
						else{
							troupesToAdd[theMarker.id] = 1;
						}
						truppeToAddPerTurno -= 1;
						theMarker.troupes += 1;

						theMarker.setOptions({
							icon: createCenterIcon(theMarker.troupes).mainIcon
						});
						$("#stepStatus").html("Generale "+nick+", hai ancora "+truppeToAddPerTurno+" armate da posizionare!<br/><input type='button' value='annulla posizionamento truppe' id='annullaPosTroupes'>");

						if ( truppeToAddPerTurno == 0 ){
							$("#annullaPosTroupes").unbind().remove();
							socket.emit("addTroup", {
								mapping: troupesToAdd,
								//statoId: theMarker.id,
								sessionId: sessionId,
								//unit: 1,
								matchId: matchId
							});
						}

					}
					else if ( contatoreTurni > 0 && turnEnable && statoTurno == 1 && isMyState(theMarker.id) ){
						//Ora provvedo a selezionare uno dei miei stati da cui attaccare
						if ( theMarker.troupes < 2 ){
                            show_note({type:"error", message:"Non puoi attaccare con 1 sola armata dal territorio "+theMarker.title});
							return;
						}
						theMarker.attackFrom = !theMarker.attackFrom;
						socket.emit("getConfini", {
							stato: theMarker.id,
							sessionId: sessionId,
							activeStates: activeStates,
							matchId: matchId,
							offenderName: theMarker.title
						});
					}
					else if ( contatoreTurni > 0 && turnEnable && statoTurno == 1 && attackFrom !== undefined && isStatoConfinante(theMarker.id) ){

						var offender = getMarker(attackFrom);
						if ( !offender || ( offender && offender.troupes < 2 ) ){
							show_note({type:"error", message:"Non puoi attaccare con 1 sola armata dal territorio "+theMarker.title});
							return;
						}

						if ( $("#dices").is(":visible") == false ){
							socket.emit("attack", {
								sessionId: sessionId,
								stateToAttack: theMarker.id,
								matchId: matchId,
								defenderName: theMarker.title
							});
						}
					}
					else if ( contatoreTurni>0 && turnEnable && statoTurno == 2 && isMyState(theMarker.id) && moveFrom !== undefined ){
						moveTroupTo(moveFrom, theMarker.id, sessionId);
					}
					else if ( contatoreTurni > 0 && turnEnable && statoTurno == 2 && isMyState(theMarker.id) ){
						if ( theMarker.troupes < 2 ){
                            show_note({type:"error", message:"Non puoi spostare nulla da questo stato!"});
							return;
						}
						moveFrom = theMarker.id;
						socket.emit("getMyConfini",
							{stato: theMarker.id,
							 sessionId: sessionId,
							 activeStates: activeStates,
							 matchId: matchId,
							 defenderName: theMarker.title
							 }
						);
					}
					else{
						show_note({type:"warn", message:"Stai facendo qualcosa che non dovresti...."});
					}
                });

			}

		})
	var timer = setInterval(function(){
		if ( sessionId !== null && matchId !== null ){
			clearInterval(timer);
			socket.emit("getActualWorld", {sessionId: sessionId, matchId: matchId});
			socket.emit("getStatesOfContinent", { sessionId: sessionId, matchId: matchId });
		}
	}, 1000);


	});
}

function getPolygon(statoId){
    var polygon = null;
    for(var i=0; i < polygons.length; i++){
        if ( polygons[i].id == statoId ){
            polygon = polygons[i];
            break;
        }
    }
    return polygon;
}

function getMarker(statoId){
    var marker = null;
    for(var i=0; i < markers.length; i++){
        if ( markers[i].id == statoId ){
            marker = markers[i];
            break;
        }
    }
    return marker;
}

function sendToChat(msg, isStatusMessage, onNote){
	if (isStatusMessage !== false) {
    	isStatusMessage = true;
    }
	socket.emit("chatMessage", {
				msg: msg,
				from: sessionId,
				isStatusMessage: isStatusMessage,
				matchId: matchId
	});
	if ( onNote ){
		show_note({type:onNote.type, message:msg, delay:onNote.delay});
	}
}

function createCenterIcon(num, color) {
  if ( color == undefined ){
	color = "dddddd";
  }
  if ( cacheImages[num+"_"+color] === undefined ){

      var iconOptions = {};
      var width = 24;
      var height = 24;
      var shadow_anchor_x = 0;
      var shadow_anchor_y = 0;

      iconOptions.width = width;
      iconOptions.height = width;
      iconOptions.primaryColor = "#CC0432";
      iconOptions.strokeColor = "#000000";
      iconOptions.cornerColor = "#FFFFFF";
	  iconOptions.background = color;
      iconOptions.label = ""+num;
      var icon = MapIconMaker.createLabeledMarkerIcon(iconOptions);
      /*
      var iconShadow = new google.maps.MarkerImage();

      iconShadow.url = "/images/marker_shadow.png";
      iconShadow.size = new google.maps.Size(width, height);
      iconShadow.scaledSize = new google.maps.Size(width, height);
      iconShadow.anchor = new google.maps.Point(shadow_anchor_x, shadow_anchor_y);
      */
      var icons = {};
      icons.mainIcon = icon;
      //icons.shadowIcon = iconShadow;

      cacheImages[num+"_"+color] = icons;
      //console.log(num+"_"+color+" appena creato e messo in cache");
      return icons;

  }
  else{
	  //console.log(num+"_"+color+" presente in cache");
      return cacheImages[num+"_"+color];
  }

}

function show_note(opts) {
	var title = opts.title ? opts.title : "News";
	var blk = opts.notblocking === undefined ? true : opts.notblocking;
	var type = opts.type ? opts.type : "info";
	var delay = opts.delay ? opts.delay : 5000;
	var message = opts.message ? opts.message : "";
	switch(type){
		case "error":
			title = "Azione non valida!";
			break;
		case "info":
			title = "Info";
			break;
		case "warn":
			title = "Attenzione...";
			break;
	}
	var opts = {
			title: title,
			text: message,
			type: type,
			delay: delay,
			nonblock: blk,
			history: true,
			sticker: false
	};
	$.pnotify(opts);
}

function reloadMatch(actionUrl, matchId, newPage){
    var form = $("<form method='POST' action='/"+actionUrl+"?q="+new Date().getTime()+"' id='joinMatchForm' "+(newPage ? " target='_blank_"+matchId+"' " : "")+">\
                        <input type='hidden' name='matchId' value='"+matchId+"'>\
                        <input type='hidden' name='_csrf' value='"+csrf+"'>\
                        <input type='hidden' name='player_color' value='"+mycolor+"'>\
                    </form>");
    form.appendTo($('body'));
    form.submit();
}

/**
 * Crea l'info bubble
 */

function buildNewInfoBubble(map) {
       var ib = new InfoBubble({
          map: map,
          shadowStyle: 1,
          padding: 12,
          backgroundColor: 'rgb(241,241,183)',
          borderRadius: 50,
          arrowSize: 20,
          borderWidth: 5,
          borderColor: 'rgb(152,158,87)',
          disableAutoPan: false,
          disableAnimation: false,
          hideCloseButton: true,
          arrowPosition: 50,
          //backgroundClassName: 'infowin-bck',
          arrowStyle: 0,
		  opacity: 0.65
      });
	  return ib;
}

function sendMousePosition(event){
	if ( isItMyTurn ){
		socket.emit("sendMousePosition", {
			sessionId: sessionId,
			matchId: matchId,
			lat: event.latLng.lat(),
			lng: event.latLng.lng()
		});
	}
}
