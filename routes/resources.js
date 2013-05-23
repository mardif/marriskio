var common = require("../games/risiko/common");

module.exports = function(app) {
    /* Risorse */
    // JAVASCRIPT
    app.get("/jquery.js", common.staticHandler("./games/risiko/js/jquery-1.9.1.min.js"));
    app.get("/jquery-ui.js", common.staticHandler("./games/risiko/js/jquery-ui-1.9.2.custom.min.js"));
    //app.get("/login", common.staticHandler("./js/login.js"));
    app.get("/mapiconmaker.js", common.staticHandler("./games/risiko/js/mapiconmaker.js"));
    app.get("/confini", common.staticHandler("./games/risiko/confiniRisiko.kml"));
    app.get("/map", common.staticHandler("./games/risiko/js/map.js"));
    app.get("/infobubble", common.staticHandler("./games/risiko/js/infobubble.js"));
    app.get("/mousewheel", common.staticHandler("./games/risiko/js/jquery.mousewheel.min.js"));
    app.get("/scrollbar", common.staticHandler("./games/risiko/js/jquery.contentcarousel.js"));
    app.get("/sound-effect-manager.js", common.staticHandler("./games/risiko/js/sound-effect-manager.js"));
    app.get("/bootstrap.js", common.staticHandler("./games/risiko/js/bootstrap.min.js"));
    app.get("/pnotify.js", common.staticHandler("./games/risiko/js/jquery.pnotify.js"));
    app.get("/bootstrap-acknowledgeinput", common.staticHandler("./games/risiko/js/bootstrap-acknowledgeinput.min.js"));
    app.get("/tokeninput.js", common.staticHandler("./games/risiko/js/jquery.tokeninput.js"));
    //app.get("/socket.io", common.staticHandler("/socket.io/socket.io.js"));


    // SUONI
    app.get("/bell", common.staticHandler("./games/risiko/sounds/small-bell-ring-01.mp3"));
    app.get("/spy", common.staticHandler("./games/risiko/sounds/spy.mp3"));
    app.get("/atomicbomb", common.staticHandler("./games/risiko/sounds/Bomb.wav"));
    app.get("/cecchinoSound", common.staticHandler("./games/risiko/sounds/GUNSHOT.WAV"));
    app.get("/defense", common.staticHandler("./games/risiko/sounds/defense.mp3"));
    app.get("/attack", common.staticHandler("./games/risiko/sounds/attack.mp3"));
    app.get("/rinforzo", common.staticHandler("./games/risiko/sounds/rinforzo.mp3"));
    app.get("/epidemiaSound", common.staticHandler("./games/risiko/sounds/dragon.mp3"));
    app.get("/air", common.staticHandler("./games/risiko/sounds/JETFLY2.mp3"));
    app.get("/attaccoTruppe", common.staticHandler("./games/risiko/sounds/attaccoTerra.mp3"));
    app.get("/sabotage", common.staticHandler("./games/risiko/sounds/sabotage.mp3"));
    app.get("/allianceSound", common.staticHandler("./games/risiko/sounds/alliance.mp3"));

    // CSS
    app.get("/map.css", common.staticHandler("./css/map.css"));
    app.get("/scrollbar.css", common.staticHandler("./css/jquery.jscrollpane.css"));
    app.get("/style.css", common.staticHandler("./css/style.css"));
    app.get("/bootstrap.min.css", common.staticHandler("./css/bootstrap.min.css"));
    app.get("/bootstrap-responsive.min.css", common.staticHandler("./css/bootstrap-responsive.css"));
    app.get("/pnotify.css", common.staticHandler("./css/jquery.pnotify.default.css"));
    app.get("/pnotify.icons.css", common.staticHandler("./css/jquery.pnotify.default.icons.css"));
    app.get("/index.css", common.staticHandler("./css/index.css"));
    app.get("/token-input.css", common.staticHandler("./css/token-input.css"))
    app.get("/token-input-fb.css", common.staticHandler("./css/token-input-facebook.css"))


    app.get("/left", common.staticHandler("./images/leftB.png"));
    app.get("/right", common.staticHandler("./images/rightB.png"));
    app.get("/up", common.staticHandler("./images/up.png"));
    app.get("/down", common.staticHandler("./images/down.png"));
    app.get("/users", common.staticHandler("./images/users.png"));
    app.get("/notes", common.staticHandler("./images/notes.png"));
    app.get("/dices", common.staticHandler("./images/dices2.gif"));
    app.get("/dice1", common.staticHandler("./images/1.png"));
    app.get("/dice2", common.staticHandler("./images/2.png"));
    app.get("/dice3", common.staticHandler("./images/3.png"));
    app.get("/dice4", common.staticHandler("./images/4.png"));
    app.get("/dice5", common.staticHandler("./images/5.png"));
    app.get("/dice6", common.staticHandler("./images/6.png"));
    app.get("/dice1r", common.staticHandler("./images/1r.png"));
    app.get("/dice2r", common.staticHandler("./images/2r.png"));
    app.get("/dice3r", common.staticHandler("./images/3r.png"));
    app.get("/dice4r", common.staticHandler("./images/4r.png"));
    app.get("/dice5r", common.staticHandler("./images/5r.png"));
    app.get("/dice6r", common.staticHandler("./images/6r.png"));
    app.get("/dice1g", common.staticHandler("./images/1g.png"));
    app.get("/dice2g", common.staticHandler("./images/2g.png"));
    app.get("/dice3g", common.staticHandler("./images/3g.png"));
    app.get("/dice4g", common.staticHandler("./images/4g.png"));
    app.get("/dice5g", common.staticHandler("./images/5g.png"));
    app.get("/dice6g", common.staticHandler("./images/6g.png"));
    app.get("/arrow",  common.staticHandler("./images/arrow.gif"));
    app.get("/arrow2",  common.staticHandler("./images/arrow_rev.gif"));
    app.get("/arrow3",  common.staticHandler("./images/arrow_rev_up.gif"));
    app.get("/arrow4",  common.staticHandler("./images/arrow_up.gif"));
    app.get("/cards", common.staticHandler("./images/cards.png"));
    app.get("/carousel_btns.png", common.staticHandler("./images/carousel_btns.png"));
    app.get("/shadow.png", common.staticHandler("./images/shadow.png"));
    app.get("/arrows.png", common.staticHandler("./images/arrows.png"));
    app.get("/cross.png", common.staticHandler("./images/cross.png"));
    app.get("/template", common.staticHandler("./images/card_template.png"));
    app.get("/atomic", common.staticHandler("./images/atomic.png"));
    app.get("/alleanza", common.staticHandler("./images/alleanza.png"));
    app.get("/attaccoAereo", common.staticHandler("./images/attaccoAereo.jpg"));
    app.get("/attaccoTerra", common.staticHandler("./images/attaccoTerra.png"));
    app.get("/cecchino", common.staticHandler("./images/cecchino.jpg"));
    app.get("/sabotaggio", common.staticHandler("./images/sabotaggio.jpg"));
    app.get("/spyCard", common.staticHandler("./images/spy.jpg"));
    app.get("/difesaCard", common.staticHandler("./images/difesaCard.jpg"));
    app.get("/attaccoCard", common.staticHandler("./images/attaccoCard.png"));
    app.get("/epidemia", common.staticHandler("./images/epidemia.jpg"));
    app.get("/close.png", common.staticHandler("./images/close.png"));
    app.get("/scudo", common.staticHandler("./images/scudo.png"));
    app.get("/conquered_small", common.staticHandler("./images/conquered_small.png"));
    app.get("/plus1", common.staticHandler("./images/piu1.png"));
    app.get("/main", common.staticHandler("./images/main.jpg"));
    app.get("/chrome", common.staticHandler("./images/google-chrome.png"));
    app.get("/seatFree", common.staticHandler("./images/seatFree.png"));
    app.get("/seatBusy", common.staticHandler("./images/seatBusy.png"));
    app.get("/play", common.staticHandler("./images/play.png"));

    app.get("/glyphicons-halflings.png", common.staticHandler("./images/bootstrap/glyphicons-halflings.png"));
    app.get("/glyphicons-halflings-white.png", common.staticHandler("./images/bootstrap/glyphicons-halflings-white.png"));
};