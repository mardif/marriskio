var util = require("util"),
    //sessionManager = require("./sessionManager"),
    cards = require("./cards"),
    parseCookie = require('connect').utils.parseCookie,
    db = require(rootPath+'/db/accessDB').getDBInstance,
    common = require("./common");

module.exports = function(sio, socket){
  
    util.log("INZIALIZZAZIONE SOCKET!!!!!");

    //var sessionManager = new session.SessionManager();
    socket.on("firstConnect", function(data){
        
        var sess = socket.handshake.session;
        var user = sess.passport.user;
        
      if ( !(data && data.matchId) ){
          return;
      }
        
      util.log("first connect called");
      /*
      if ( sessionManager.checkUserExists(user.nick) === false ){
        util.log("user "+user.nick+" not exists in match!");
        sessionManager.addSession(user, data.matchId);
      }
      */

        util.log("rilevato l'utente "+user.nick+" in partita!");
        var session = sessionManager.getSession(user._id, data.matchId);
        
        if ( session && session.matchId ){
          var match = getMatch(session.matchId);
          if ( !match ){ return; }
          var engine = match.getEngine();

          sessionManager.setSessionStatus(user._id, session.matchId, true);

          
            if ( session.AIActivated === true ){
                sio.sockets.in(socket.store.data.matchId).emit("joinUser", {
                    users: engine.getSessions(),
                    num_players: match.getBean().num_players,
                    engineLoaded: engine.isEngineLoaded()
                });
                return;
            }
          
          
          util.log("         "+session.nick+" first connect sessionId: "+user._id+" - matchId: "+session.matchId);
          util.log("         match winner "+match.getBean().winner);
          socket.set('matchId', engine.getMatchId(), function() { util.log(session.nick+' join on match ' + engine.getMatchId()); } );
          socket.set("sessionId", session.id, function(){ util.log("sessionId ["+session.id+"] legato al socket!"); });
          socket.set('active', true);
          socket.join(socket.store.data.matchId);
          
          util.log("          total rooms: "+util.inspect(sio.sockets.manager.rooms));
          util.log("          specific clients on room "+engine.getMatchId()+": ");
          var clients = sio.sockets.clients(engine.getMatchId());
          for (var s in clients){
              util.log("          "+clients[s].id);
          }
          util.log("notify on "+socket.store.data.matchId+" room");
          util.log("notifying... "+sio.sockets.in(socket.store.data.matchId));
          sio.sockets.in(socket.store.data.matchId).emit("joinUser", { 
            users: engine.getSessions(), 
            num_players: match.getBean().num_players,
            engineLoaded: engine.isEngineLoaded()
          });
          socket.emit("getSessionId", {sessionId: session.id, matchId: socket.store.data.matchId});
        }
    });

    socket.on("disconnect", function(){
        util.log("disconnecting");
        
        if ( socket.handshake.session && socket.handshake.session.passport ){
            util.log("socket dell'utente "+socket.handshake.session.passport.user.nick+" disconnesso!");
            util.log("passport? "+socket.handshake.session.passport);
        }
        else{
            //significa che la sessione è ormai compromessa
            return;
        }
        
        /*
            ci possono essere dei refresh forzati, per cui la stessa sessione può essere associata a più socket-session.
            quando avviene ciò, conviene fare una scansione dei socket-session ancora attivi e verificare se c'è
            una socket-session attiva con la stesse sessionId, per evitare di buttare fuori un giocatore che ha fatto
            semplicemente un reload
        */        
        var socketClients = sio.sockets.in(socket.store.data.matchId).clients();
        var maintainSession = false;
        for(var idx in socketClients){
            var s = socketClients[idx];
            if ( socket.store.id != s.store.id ){
                if ( socket.store.data.sessionId == s.store.data.sessionId ){
                    maintainSession = true;
                    break;
                }
            }
        }
        if ( maintainSession === true ){
            util.log("rimozione del socket, ma non della sessione dell'utente "+(socket.handshake.session ? socket.handshake.session.passport.user.nick : "")+"!")
            return;
        }
        //------------------------------------------------------------------------------------------------------------------
        
        var sessionId = socket.handshake.session.passport.user._id;
        var match = getMatch(socket.store.data.matchId);
        if ( !match ){ return; }
        var engine = match.getEngine();

        sessionManager.setSessionStatus(sessionId, socket.store.data.matchId, false);

        sio.sockets.in(socket.store.data.matchId).emit("joinUser", { users: engine.getSessions(), num_players: match.getBean().num_players, engineLoaded: engine.isEngineLoaded() });
    });

    socket.on("changeActivePlayer", function(data){
        util.log("change active player:" + data.sessionId + "-->" + data.nick);
        sio.sockets.in(socket.store.data.matchId).emit("notifyUserTurn", 
            {
                sessionId: data.sessionId,
                nick: data.nick,
            });
    });

    socket.on("chatMessage", function(data){
        var session = sessionManager.getSession(data.from, data.matchId);
        if ( !session ){
            util.log("ricevuto messaggio di chat da sconosciuto");
            return;
        }
        var engine = getEngine(data.matchId);
        if ( !engine ){
            util.log("ricevuto messaggio di chat non appartenente ad alcun match");
            return;
        }
        data.color = session.color;
        data.nick = session.nick;
        
        util.log(data.nick+" [match "+data.matchId+"] wrote: "+data.msg);

        sio.sockets.in(socket.store.data.matchId).emit("broadcastChat", data);
    });

    socket.on("getConfini", function(data){

        util.log("getConfini: "+util.inspect(data)+" -> highlightStatiConfinanti");

        if ( checkSessionTurn(data.matchId, data.sessionId, socket) === false ){
            return;
        }

        var engine = getEngine(data.matchId);
        if ( !engine ){ return; }

        var confini = engine.getConfini(data.stato, data.sessionId);
        engine.setAttackFrom(data.stato);
        sio.sockets.in(socket.store.data.matchId).emit("highlightStatiConfinanti",
            {
                id: data.stato,
                confini: confini,
                oldActiveStates: data.activeStates,
                attackFrom: data.stato,
                offenderName: data.offenderName
            }
        );
    });

    socket.on("getMyConfini", function(data){

        util.log("getMyConfini: "+util.inspect(data)+" -> highlightStatiConfinanti");

        if ( checkSessionTurn(data.matchId, data.sessionId, socket) === false ){
            return;
        }

        var engine = getEngine(data.matchId);
        if ( !engine ){ return; }
        var confini = engine.getMyConfini(data.stato, data.sessionId);
        engine.setMoveFrom(data.stato);
        sio.sockets.in(socket.store.data.matchId).emit("highlightStatiConfinanti",
            {
            id: data.stato,
            confini: confini,
            oldActiveStates: data.activeStates,
            moveFrom: data.stato
            }
        );
    });

    socket.on("attack", function(data){
        util.log("attack: "+util.inspect(data)+" -> showDices && attackResults");

        if ( checkSessionTurn(data.matchId, data.sessionId, socket) === false ){
            return;
        }

        var engine = getEngine(data.matchId);
        if ( !engine ){ return; }

        sio.sockets.in(socket.store.data.matchId).emit("showDices", {defenderName: data.defenderName, state: data.stateToAttack, sessionId: data.sessionId});

        var result = engine.attack(data.stateToAttack);
        result.defenderName = data.defenderName;

        //result.haveWeAWinner = engine.haveWeAWinner(data);

        setTimeout(function(){
            sio.sockets.in(socket.store.data.matchId).emit("attackResults", result);
        },1000);
        
        if ( engine.haveWeAWinner(data) ){
            var match = getMatch(socket.store.data.matchId);
            match.getBean().winner = data.sessionId;
            engine.gameEnd = true;
            engine.winner = data.sessionId;
            saveMatch(match);
            var session = engine.getSession(data.sessionId);
            util.log("AND THE WINNER IS "+session.nick);
            sio.sockets.in(socket.store.data.matchId).emit("WeHaveAWinner", {
                winner: engine.winner,
                nick: session.nick
            });

            sendVictoryEmail(match, session.nick);

        }

    });
    
    socket.on("testCall", function(data){
        sio.sockets.in(socket.store.data.matchId).emit(data.action, data.data);
    });

    socket.on("caricaStati", function(data){
        util.log("caricaStati: "+util.inspect(data)+" -> buildEntireMap");

        if ( checkSessionTurn(data.matchId, data.sessionId, socket) === false ){
            return;
        }

        var match = getMatch(data.matchId);
        if ( !match ){ return; }
        
        var engine = match.getEngine();
        
        db.setStatusMatch(true, match.getBean(), function(err, dbMatch){
            
            if ( err ){
                util.log("impostazione dello stato del match "+data.matchId+" non riuscito!");
                return;
            }
            
            saveMatch(match);
            
        });

        engine.caricaStati();
        sendBuildEntireMap(sio, socket, match, engine.getTurnoAttuale());
        /*
        sio.sockets.in(socket.store.data.matchId).emit("buildEntireMap", {
            stati: engine.caricaStati(),
            engineLoaded: engine.isEngineLoaded(),
            turno: engine.getTurnoAttuale(),
            num_players: match.getBean().num_players
        });
        */
    });

    socket.on("getActualWorld", function(data){
        //torna la situazione globale aggiornata degli stati
        util.log("getActualWorld: "+util.inspect(data)+" -> buildEntireMap");

        if ( checkSessionTurn(data.matchId, data.sessionId, socket, true) === false ){
            return;
        }

        var match = getMatch(data.matchId);
        if ( !match ){ return; }
        
        var engine = match.getEngine();

        if ( data && data.nextStep ){
            var changePlayer = engine.nextStep();
            if ( changePlayer === true ){
                saveMatch(match);
                /*
                verifica se il giocatore del prossimo turno è online o meno: 
                - se è online, si continua così
                - se è offline, viene mandata un'email ed inviata una notifica a tutti gli altri giocatori online
                */
                //var turnSession = sessionManager.getSession(engine.getSessioneDiTurno());
                var turnSession = engine.getSession(engine.getSessioneDiTurno());
                if ( turnSession && turnSession.statusActive === false ){
                    var body = common.getHeaderMailTemplate();
                    body += "Un saluto dal team di Debellum!<br/>\
                                        <br/>Volevamo informarti che è il tuo turno nella partita "+match.getBean().name+"!<br/>\
                                        <br/><b>Entra subito, gioca le tue carte e conquista il mondo!</b>";
                    body += common.getFooterMailTemplate();

                    var headers = {
                       text:    body,
                       from:    "debellum.reminder@debellum.net",
                       bcc:      turnSession.email,
                       subject: "Debellum: è il tuo turno!"
                    };

                    common.sendEmail(headers);

                    sio.sockets.in(socket.store.data.matchId).emit("errorOnAction", {
                        level: "info",
                        message: "L'utente "+turnSession.nick+" non è al momento disponibile. Attendi online le sue mosse, oppure chiudi tranquillamente: verrai avvisato tramite email quando sarà di nuovo il tuo turno!",
                        delay: 30000
                    });
                }


            }

        }
        else if ( data && data.prevStep === true ){
            var canBack = engine.prevStep();
            if ( canBack === false ){
                sio.sockets.in(socket.store.data.matchId).emit("errorOnAction", {
                        level: "error",
                        message: "Non puoi tornare alla fase di attacco: hai già eseguito lo spostamento di fine turno. Se credi ci sia un problema, chiudi questa pagina e rientra dalla tua pagina di account!",
                        delay: 10000
                });
            }
            util.log("clicco sul prevStep: result: "+canBack);
        }
        else if ( data && data.nextStep === false ){
            util.log("salvataggio dei rinforzi initiali effettuato: ora si iniziano i turni preliminari");
            saveMatch(match);
            var turnSession = engine.getSession(engine.getSessioneDiTurno());
            if ( turnSession && turnSession.statusActive === false ){
                var body = common.getHeaderMailTemplate();
                body += "Un saluto dal team di Debellum!<br/>\
                                    <br/>Volevamo informarti che è il tuo turno nella partita "+match.getBean().name+"!<br/>\
                                    <br/><b>Entra subito, gioca le tue carte e conquista il mondo!</b>";
                body += common.getFooterMailTemplate();

                var headers = {
                   text:    body,
                   from:    "debellum.reminder@debellum.net",
                   bcc:      turnSession.email,
                   subject: "Debellum: è il tuo turno!"
                };

                common.sendEmail(headers);

                sio.sockets.in(socket.store.data.matchId).emit("errorOnAction", {
                    level: "info",
                    message: "L'utente "+turnSession.nick+" non è al momento disponibile. Attendi online le sue mosse, oppure chiudi tranquillamente: verrai avvisato tramite email quando sarà di nuovo il tuo turno!",
                    delay: 30000
                });
            }            
        }

        sendBuildEntireMap(sio, socket, match, engine.getTurnoAttuale());
        /*
        sio.sockets.in(socket.store.data.matchId).emit("buildEntireMap", {
            stati:  engine.getActualWorld(),
            engineLoaded: engine.isEngineLoaded(),
            turno: engine.getTurnoAttuale(),
            num_players: match.getBean().num_players
        });
        */
    });

    socket.on("addInitialTroups", function(data){

        util.log("addInitialTroups: "+util.inspect(data)+" -> initialTroupAdded");

        if ( checkSessionTurn(data.matchId, data.sessionId, socket, true) === false ){
            return;
        }

        var engine = getEngine(data.matchId);
        if ( !engine ){ return; }

        var session = engine.getSession(data.sessionId);

        var obj = addTroupe(session, data, engine);

        if ( obj.initialTroupes === 0 ){
            saveMatch(getMatch(data.matchId));
        }

        sio.sockets.in(socket.store.data.matchId).emit("initialTroupAdded", {
            sessionId: data.sessionId,
            statoId: data.statoId,
            troupes: obj.num,
            troupesRemaining: obj.initialTroupes,
            initialTurnFinished : engine.checkInitialTroupesHasFinished()
        });
    });

    socket.on("addTroup", function(data){
        util.log("addTroup: "+util.inspect(data)+" -> troupAddedOnTurn");

        if ( checkSessionTurn(data.matchId, data.sessionId, socket) === false ){
            return;
        }

        var match = getMatch(data.matchId);
        if ( !match ){ return; }
        var engine = getEngine(data.matchId);
        if ( !engine ){ return; }
        var session = engine.getSession(data.sessionId);
        if ( !session ){ return; }
        
        //TODO: controllo!!!!
        var result = addMassiveTroupes(session, data, engine);
        if ( result === true ){
            sio.sockets.in(socket.store.data.matchId).emit("troupAddedOnTurn", {
                sessionId: data.sessionId,
                mapping: data.mapping
            });
        }
        else{
            sendBuildEntireMap(sio, socket, match, engine.getTurnoAttuale());
            /*
            sio.sockets.in(socket.store.data.matchId).emit("buildEntireMap", {
                stati:  engine.getActualWorld(),
                engineLoaded: engine.isEngineLoaded(),
                turno: engine.getTurnoAttuale(),
                num_players: match.getBean().num_players
            });
            */
        }
    });

    socket.on("moveTroupToStateConquered", function(data){
        util.log("moveTroupToStateConquered: "+util.inspect(data)+" -> resultMoveTroupesTo");

        if ( checkSessionTurn(data.matchId, data.sessionId, socket) === false ){
            return;
        }

        var engine = getEngine(data.matchId);
        if ( !engine ){ return; }
        var result = engine.moveTroupToStateConquered(data);
        sio.sockets.in(socket.store.data.matchId).emit("resultMoveTroupesTo", result);
    });

    socket.on("moveTroupTo", function(data){

        util.log("moveTroupTo: "+util.inspect(data)+" -> resultMoveTroupesTo");
        if ( checkSessionTurn(data.matchId, data.sessionId, socket) === false ){
            return;
        }

        var engine = getEngine(data.matchId);
        if ( engine.isStatoConfinante( data.statoFrom, data.statoTo, data.sessionId ) === false ){
            //engine.setMoveTo(-1);
            sio.sockets.in(socket.store.data.matchId).emit("resultMoveTroupesTo", {
                statoFrom: engine.findStatoById(data.statoFrom),
                statoTo: engine.findStatoById(data.statoTo),
                error: "Lo stato non e' confinante!",
                sessionId: data.sessionId
            });
            return;
        }

        if ( engine.getMoveTo() == -1 ){
            engine.setMoveTo(data.statoTo);
        }
        else{
            if ( engine.getMoveTo() != -1 && engine.getMoveTo() != data.statoTo ){
                socket.emit("resultMoveTroupesTo", {
                    statoFrom: engine.findStatoById(data.statoFrom),
                    statoTo: engine.findStatoById(engine.getMoveTo()),
                    error: "Spostamento non valido",
                    sessionId: data.sessionId
                });
                return;
            }
        }

        data.finalMove = true;

        var result = engine.moveTroupToStateConquered(data);
        sio.sockets.in(socket.store.data.matchId).emit("resultMoveTroupesTo", result);

    });

    socket.on("getStatesOfContinent", function(data){
        util.log("getStatesOfContinent: "+util.inspect(data)+" -> returnStatesMap");

        /*
        if ( checkSessionTurn(data.matchId, data.sessionId, socket) === false ){
            return;
        }
        */

        var match = getMatch(data.matchId);
        if ( !match ){
          return;
        }
        var engine = match.getEngine();        
        var statesMap = engine.getContinents();
        sio.sockets.in(socket.store.data.matchId).emit("returnStatesMap", statesMap);
        sio.sockets.in(socket.store.data.matchId).emit("joinUser", { users: engine.getSessions(), num_players: match.getBean().num_players, engineLoaded: engine.isEngineLoaded() });
    });

    socket.on("getMyBonusCard", function(data){
        util.log("getMyBonusCard: "+util.inspect(data));

        if ( checkSessionTurn(data.matchId, data.sessionId, socket, true) === false ){
            return;
        }

        var engine = getEngine(data.matchId);
        var player = engine.getSession(data.sessionId);
        if ( !player ){
            util.log("player "+data.sessionId+" not found with matchId "+data.matchId);
            return;
        }
        socket.emit("receiveMyBonyusCard", { cards: player.getCards() });
    });

    socket.on("getCardForHelp", function(data){
        if ( data && data.matchId ){
            var engine = getEngine(data.matchId);
            socket.emit("receiveCardForHelp", { cards: engine.deck.getDistinctCards() });
        }
    });

    socket.on("useCardBonus", function(data){
        util.log("useCardBonus: "+util.inspect(data));
        if ( checkSessionTurn(data.matchId, data.sessionId, socket) === false ){
            return;
        }

        var engine = getEngine(data.matchId);
        var player = engine.getSession(data.sessionId);
        var card = player.getCard(data.cardId);
        if ( card === undefined ){
            //questo utente sta barando....
            util.log("l'utente "+player.nick+" sta barando: vuole utilizzare una carta che non ha: "+data.cardId);
        }

        player.applyCard(card);

        sio.sockets.in(socket.store.data.matchId).emit("playerUsesBonusCard", {
            card: card,
            sessionId: engine.getSessioneDiTurno(),
            matchId: data.matchId,
            nick: player.nick
        });

    });

    socket.on("getCardHelp", function(data){
        util.log("getCardHelp: "+util.inspect(data)+" --> receiveCardHelp");

        var engine = getEngine(data.matchId);
        var card = engine.getCard4Help(data.cardId);
        socket.emit("receiveCardHelp", {card: card});

    });

    socket.on("cancelBonusCardAction", function(data){
        util.log("cancelBonusCardAction: "+util.inspect(data));
        if ( checkSessionTurn(data.matchId, data.sessionId, socket) === false ){
            return;
        }

        var match = getMatch(data.matchId);
        if ( !match ){
          return;
        }
        var engine = match.getEngine();
        var player = engine.getSession(data.sessionId);

        player.addCard(player.interactiveCard);
        player.invalidateInteractCard();
        sendBuildEntireMap(sio, socket, match, engine.getTurnoAttuale());
        /*
        sio.sockets.in(socket.store.data.matchId).emit("buildEntireMap", {
            stati:  engine.getActualWorld(),
            engineLoaded: engine.isEngineLoaded(),
            turno: engine.getTurnoAttuale(),
            num_players: match.getBean().num_players
        });
        */

    });

    socket.on("epidemia", function(data){
        util.log("epidemia: "+util.inspect(data));
        if ( checkSessionTurn(data.matchId, data.sessionId, socket, false) === false ){
            return;
        }

        var match = getMatch(data.matchId);
        if ( !match ){
          return;
        }
        var engine = match.getEngine();
        var player = engine.getSession(data.sessionId);
        var enemy = engine.getSession(data.playerId);

        //controllo alleanza
        if ( player.isAlliancedWithMe(data.playerId) ){
            socket.emit("errorOnAction", {
            message: "Sei in alleanza con questo giocatore!",
            sessionId: data.sessionId,
            matchId: data.matchId,
            action: "setTimeout(function(){ maximizeUsers(); }, 2000);"
            });
            return;
        }

        engine.applyEpidemia(data.playerId);

        player.invalidateInteractCard();

        var turno = engine.getTurnoAttuale();
        turno.cardMessage = "I territori di "+enemy.nick+" sono invasi dal colera!<br/>Secondo i servizi segreti, la responsabilit&agrave; sarebbe di "+player.nick;
        sendBuildEntireMap(sio, socket, match, turno);
        /*
        sio.sockets.in(socket.store.data.matchId).emit("buildEntireMap", {
            stati:  engine.getActualWorld(),
            engineLoaded: engine.isEngineLoaded(),
            turno: turno,
            num_players: match.getBean().num_players
        });
        */


    });

    socket.on("sendAttack", function(data){
        util.log("sendAttack: "+util.inspect(data));
        if ( checkSessionTurn(data.matchId, data.sessionId, socket, false) === false ){
            return;
        }

        var match = getMatch(data.matchId);
        if ( !match ){
          return;
        }
        var engine = match.getEngine();
        var player = engine.getSession(data.sessionId);
        var statoAttaccato = engine.findStatoById(data.statoId);
        var enemy = engine.getSession(statoAttaccato.member);

        //controllo alleanza
        if ( player.isAlliancedWithMe(enemy.id) ){
            socket.emit("errorOnAction", {
                message: "Sei in alleanza con questo giocatore!",
                sessionId: data.sessionId,
                matchId: data.matchId
            });
            return;
        }

        var cardMessage;
        var isMyState = engine.verifyMembershipStatus(data.statoId, data.sessionId);
        var sound;
        /*
        * Se è uno stato NON mio, lo posso attaccare
        */
        if ( isMyState === false ){

            if ( data.near === true ){
                /*
                * devo controllare che lo stato sia confinante con uno dei miei
                */
                if ( engine.checkStateIsConfinant(data.statoId, data.sessionId) === false ){
                    socket.emit("errorOnAction", {
                        message: "Lo stato che vuoi attaccare non è confinante con i tuoi!",
                        sessionId: data.sessionId,
                        matchId: data.matchId
                    });
                    return;
                }
            }
            
            engine.removeTroupToState(data.statoId, player.interactiveCard.gapTroupesDefender);
            cardMessage = "Il generale "+player.nick+" ha attaccato il generale "+enemy.nick+" con la carta "+player.interactiveCard.title;
            sound = player.interactiveCard.sound;
            player.invalidateInteractCard();
        }
        else{
            socket.emit("errorOnAction", {
                message: "Ehm.... sicuro che vuoi attaccarti da solo???",
                sessionId: data.sessionId,
                matchId: data.matchId
            });
            return;
        }

        var turno = engine.getTurnoAttuale();
        turno.cardMessage = cardMessage;
        turno.sound = sound;
        turno.cardStatoId = data.statoId;
        sendBuildEntireMap(sio, socket, match, turno);
        /*
        sio.sockets.in(socket.store.data.matchId).emit("buildEntireMap", {
            stati:  engine.getActualWorld(),
            engineLoaded: engine.isEngineLoaded(),
            turno: turno,
            num_players: match.getBean().num_players
        });
        */

    });

    socket.on("getReinforcements", function(data){
        util.log("getReinforcements: "+util.inspect(data));
        if ( checkSessionTurn(data.matchId, data.sessionId, socket, false) === false ){
            return;
        }

        var match = getMatch(data.matchId);
        if ( !match ){
          return;
        }
        var engine = match.getEngine();
        var player = engine.getSession(data.sessionId);
        var isMyState = engine.verifyMembershipStatus(data.statoId, data.sessionId);
        var cardMessage;
        /*
        * Se è uno stato mio, lo posso rinforzare
        */
        if ( isMyState === true ){
            engine.addTroupToState(data.statoId, player.interactiveCard.gapTroupesOffender);
            cardMessage = "Il generale "+player.nick+" ha rinforzato un proprio territorio con la carta "+player.interactiveCard.title;
            player.invalidateInteractCard();
        }
        var turno = engine.getTurnoAttuale();
        turno.cardMessage = cardMessage;
        turno.cardStatoId = data.statoId;
        sendBuildEntireMap(sio, socket, match, turno);
        /*
        sio.sockets.in(socket.store.data.matchId).emit("buildEntireMap", {
            stati:  engine.getActualWorld(),
            engineLoaded: engine.isEngineLoaded(),
            turno: turno,
            num_players: match.getBean().num_players
        });
        */
    });

    socket.on("Alliance", function(data){
        util.log("Alliance: "+util.inspect(data));
        if ( checkSessionTurn(data.matchId, data.sessionId, socket, false) === false ){
            return;
        }
        
        var match = getMatch(data.matchId);
        if ( !match ){
          return;
        }
        var engine = match.getEngine();
        var me = engine.getSession(data.sessionId);
        var player = engine.getSession(data.playerId);

        player.addAlliance(data.sessionId);
        me.invalidateInteractCard();

        var turno = engine.getTurnoAttuale();
        turno.cardMessage = "Il generale "+me.nick+" ha stretto un'alleanza con il generale "+player.nick;
        sendBuildEntireMap(sio, socket, match, turno);
        /*
        sio.sockets.in(socket.store.data.matchId).emit("buildEntireMap", {
            stati:  engine.getActualWorld(),
            engineLoaded: engine.isEngineLoaded(),
            turno: turno,
            num_players: match.getBean().num_players
        });
        */

    });

    socket.on("sabotage", function(data){
        util.log("sabotage: "+util.inspect(data));
        if ( checkSessionTurn(data.matchId, data.sessionId, socket, false) === false ){
            return;
        }
        var match = getMatch(data.matchId);
        if (!match){
          return;
        }
        var engine = match.getEngine();
        var me = engine.getSession(data.sessionId);
        var player = engine.getSession(data.playerId);

        //controllo alleanza
        if ( me.isAlliancedWithMe(data.playerId) ){
            socket.emit("errorOnAction", {
                message: "Sei in alleanza con questo giocatore!",
                sessionId: data.sessionId,
                matchId: data.matchId,
                action: "setTimeout(function(){ maximizeUsers(); }, 2000);"
            });
            return;
        }

        player.sabotaged = true;
        me.invalidateInteractCard();

        var turno = engine.getTurnoAttuale();
        turno.cardMessage = "Il generale "+me.nick+" ha sabotato il generale "+player.nick;
        sendBuildEntireMap(sio, socket, match, turno);
        /*
        sio.sockets.in(socket.store.data.matchId).emit("buildEntireMap", {
            stati:  engine.getActualWorld(),
            engineLoaded: engine.isEngineLoaded(),
            turno: turno,
            num_players: match.getBean().num_players
        });
        */

    });

    socket.on("spy", function(data){
        util.log("spy: "+util.inspect(data));
        if ( checkSessionTurn(data.matchId, data.sessionId, socket, false) === false ){
            return;
        }
        var match = getMatch(data.matchId);
        if ( !match ){
          return;
        }
        var engine = match.getEngine();
        var enemy = engine.getSession(data.playerId);
        var player = engine.getSession(data.sessionId);

        //controllo alleanza
        if ( player.isAlliancedWithMe(enemy.id) ){
            socket.emit("errorOnAction", {
                message: "Sei in alleanza con questo giocatore!",
                sessionId: data.sessionId,
                matchId: data.matchId,
                action: "setTimeout(function(){ maximizeUsers(); }, 2000);"
            });
            return;
        }


        util.log("giocatore "+player.nick+" possiede "+player.cards.length+" carte: "+player.cards);
        util.log("nemico "+enemy.nick+" possiede "+enemy.cards.length+" carte: "+enemy.cards);
        if ( enemy.cards.length === 0 ){
            socket.emit("errorOnAction", {
            message: "Il giocatore "+enemy.nick+" non possiede carte da ciulare....!",
            sessionId: data.sessionId,
            matchId: data.matchId,
            action: "setTimeout(function(){ maximizeUsers(); }, 2000);"
            });
            return;
        }

        var card = enemy.stealCard();
        var sound = player.interactiveCard.sound;
        player.addCard(card);
        util.log("carta rubata: "+card);
        util.log("ora giocatore "+player.nick+" possiede "+player.cards.length+" carte: "+player.cards);
        util.log("ora nemico "+enemy.nick+" possiede "+enemy.cards.length+" carte: "+enemy.cards);

        player.invalidateInteractCard();

        var turno = engine.getTurnoAttuale();
        turno.cardMessage = "Il generale "+player.nick+" ha rubato una carta bonus al generale "+enemy.nick;
        turno.sound = sound;
        sendBuildEntireMap(sio, socket, match, turno);
        /*
        sio.sockets.in(socket.store.data.matchId).emit("buildEntireMap", {
            stati:  engine.getActualWorld(),
            engineLoaded: engine.isEngineLoaded(),
            turno: turno,
            num_players: match.getBean().num_players
        });
        */
    });
    
    socket.on("abandonMatch", function(data){
        util.log("abandonMatch: "+util.inspect(data));
        if ( checkSessionTurn(data.matchId, data.sessionId, socket, true) === false ){
            return;
        }
        var match = getMatch(data.matchId);
        if ( !match ){
          return;
        }
        var engine = match.getEngine();
        
        var session = engine.getSession(data.sessionId);
        session.AIActivated = true;
        sio.sockets.in(socket.store.data.matchId).emit("joinUser", { 
            users: engine.getSessions(), 
            num_players: match.getBean().num_players,
            engineLoaded: engine.isEngineLoaded()
        });
        sio.sockets.in(socket.store.data.matchId).emit("errorOnAction", {
            message: "Il generale "+session.nick+" ha deciso di abbandonare la partita: il controllo delle sue truppe verrà preso dal sistema, che potrà solo difendere i suoi territori!",
            level: "info",
            delay: 10000
        });
        
        engine.usersAbandoned += 1;
        var populateWinner = false;
        if ( engine.getSessioneDiTurno() === session.id ){
            //ho abbandonato, per cui passo il turno al prossimo!
            engine.nextTurn();
            sendBuildEntireMap(sio, socket, match, engine.getTurnoAttuale());
            
            /*
            sio.sockets.in(socket.store.data.matchId).emit("buildEntireMap", {
                stati:  engine.getActualWorld(),
                engineLoaded: engine.isEngineLoaded(),
                turno: engine.getTurnoAttuale(),
                num_players: match.getBean().num_players
            });
            */
        }
        
        var humans = engine.getHumanUsers();
        if ( humans.length === 1 ){
            engine.gameEnd = true;
            engine.winner = humans[0];
            match.getBean().winner = engine.winner.id;
            populateWinner = true;

            sendVictoryEmail(match, humans[0].nick);
            
            //abbiamo un vincitore per abbandono degli altri giocatori!!! (KO tecnico)
            setTimeout(function(){
                sio.sockets.in(socket.store.data.matchId).emit("WeHaveAWinner", { winner: true, nick: humans[0].nick } );
            },1000);
        }
        
        saveMatch(match, populateWinner);  //salvo comunque...
        
    });

    //Eventi della mappa
    socket.on("zoom_changed", function(zoomLevel){
        sio.sockets.in(socket.store.data.matchId).emit("setZoom", {zoomLevel: zoomLevel});
    });
    socket.on("center_changed", function(center){
        //util.log("sockets emit new center position: "+center.lat+";"+center.lng);
        sio.sockets.in(socket.store.data.matchId).emit("impostaCentroMappa", {center: center});
    });
    // Fine eventi della mappa

    var getEngine = function(matchId){
        var match = getMatch(matchId);
        if ( match ){
            return match.getEngine();
        }

        return null;
    };
    
    var getMatch = function(matchId){
      var match = sessionManager.getMatchList().getMatch(matchId);
      if ( match ){
        return match;
      }
      return null;
    }

    var addMassiveTroupes = function(session, data, engine){
        if ( data && data.mapping ){
            if ( session.troupesToAdd < 1 ){
                return false;
            }
            var howManyTroupesCanIAdd = session.troupesToAdd;
            for(var state in data.mapping){
                var troupesToAdd = data.mapping[state];
                if ( troupesToAdd > howManyTroupesCanIAdd ){
                    troupesToAdd = howManyTroupesCanIAdd;
                }
                session.addTroupToState(state, troupesToAdd, false);
                engine.addTroupToState(state, troupesToAdd);
                howManyTroupesCanIAdd -= troupesToAdd;
            }
            return true;
        }
        return false;
    };

    var addTroupe = function(session, data, engine){
        var obj = session.addTroupToState(data.statoId, data.unit, data.initial);
        obj.num = engine.addTroupToState(data.statoId, obj.numberIncrement);
        return obj;
    };

    var checkSessionTurn = function(matchId, sessionId, socket, noTurnControl){
        var engine = getEngine(matchId);
        if ( !engine ){
            util.log("Match "+matchId+" non risconosciuto");

            sio.sockets.in(socket.store.data.matchId).emit("errorOnAction", { 
                message: "Si e' verificato un problema! Il match verrà ricaricato automaticamente entro 10 secondi. Se dovessero esserci ulteriori problemi, chiudi la pagina della partita e riaprila dalla tua pagina di account oppure mandare un feedback dalla pagina di account segnalando l'accaduto!",
                sessionId: sessionId,
                matchId: matchId,
                action: "setTimeout(function(){ \
                            reloadMatch('startJoinMatch', '"+matchId+"', false); \
                         }, 10000);",
                delay: 10000
            } );

            return false;
        }
        if ( engine.isEngineLoaded() ){
            var session = socket.handshake.session.passport;
            if ( noTurnControl === true ){
                return true;
            }
            else if ( sessionId != session.user._id ){
                util.log("Sessione non corrispondente: sessionId client ["+sessionId+"] <-> sessionId socket ["+session.user._id+"]");
                return false;
            }
            else if ( engine.getSessioneDiTurno() != session.user._id ){
                util.log("Il giocatore "+session.user.nick+" sta effettuando un'operazione che non può seguire in quanto non è il suo turno!");
                socket.emit("errorOnAction", {
                    delay: 10000,
                    message: "Stai effettuando un'operazione che non puoi eseguire in quanto non è il tuo turno!"
                });
                return false;
            }
            else{
                return true;
            }
        }

        return true;
    };
    
    var sendBuildEntireMap = function(sio, socket, match, turno){
        util.log("users abandoned: "+match.getEngine().usersAbandoned);
        util.log("users needed online: "+ (match.getBean().num_players - match.getEngine().usersAbandoned) );
        var winner = match.getBean().winner;
        var nickWinner;
        if ( winner ){
            nickWinner = match.getEngine().getSession(winner.id).nick;
        }
        util.log("user winner: "+winner);
        sio.sockets.in(socket.store.data.matchId).emit("buildEntireMap", {
            stati:  match.getEngine().getActualWorld(),
            engineLoaded: match.getEngine().isEngineLoaded(),
            turno: turno,
            num_players: match.getBean().num_players - match.getEngine().usersAbandoned,
            gameEnd: match.getEngine().gameEnd,
            winner: match.getBean().winner,
            nick: nickWinner
        });
    };
    
    var saveMatch = function(match, populateWinner){
        db.saveMatchStatus(match.getEngine(), match.getBean(), function(err, dbMatch){
            if ( err ){
                util.log("Error saving match "+match.id);
                return;
            }
            util.log("Match "+match.getId()+" was saved correctly");
            if ( populateWinner === true ){
                db.getMatchById(match.getId(), null, function(err, remoteDbMatch){
                    if ( err ){ 
                        util.log("error on sync db: "+err); return; 
                    }
                    match.setBean(remoteDbMatch);
                });
            }
            
        });
    };

    var sendVictoryEmail = function(match, nick){
        var body = common.getHeaderMailTemplate();
        body += "Un saluto dal team di Debellum<br/><br/>\
                Notizie dal fronte:<br/>\
                La partita "+match.getBean().name+" è stata vinta da "+nick+"<br/>\
                <br/>Partecipa ad altre partite oppure creane di nuove invitando i tuoi amici!<br/>\
                <br/>A presto su Debellum";

        var addresses = [];
        for(var i=0; i < match.getBean().players.length; i++){
            var player = match.getBean().players[i].player;
            addresses.push(player.email);
        }

        body += common.getFooterMailTemplate();
        var headers = {
           text:    body,
           from:    "wargod@debellum.net",
           bcc:      addresses.join(","),
           subject: "Debellum: Partita "+match.getBean().name+" terminata!"
        };

        common.sendEmail(headers);            

    };
    
    /*
    sio.set('authorization', function (data, accept) {
        // check if there's a cookie header
        if (data.headers.cookie) {
            // if there is, parse the cookie
            data.cookie = parseCookie(data.headers.cookie);
            // note that you will need to use the same key to grad the
            // session id, as you specified in the Express setup.
            data.sessionID = data.cookie['r1s1k0.sid'];
        } else {
           // if there isn't, turn down the connection with a message
           // and leave the function.
           util.log("Cookie non trasmesso!");
           return accept('No cookie transmitted.', false);
        }
        // accept the incoming connection
        //util.log("Autorizzazione concessa al cookie "+data.sessionID);
        accept(null, true);
    });
    */
  
};
