var common = require("../games/risiko/common");

module.exports = function(app) {
    /* Risorse */

    app.get("/confini", common.staticHandler("./games/risiko/confiniRisiko.kml"));

    // JAVASCRIPT
    app.get("/jquery.js", common.staticHandler("./games/risiko/js/jquery-1.10.2.min.js"));
    app.get("/jquery-ui-1.9.2.custom.min.js", common.staticHandler("./games/risiko/js/jquery-ui-1.9.2.custom.min.js"));
    app.get("/html5shiv.js", common.staticHandler("./games/risiko/js/html5shiv.js"));
    app.get("/jquery-1.10.2.min.js", common.staticHandler("./games/risiko/js/jquery-1.10.2.min.js"));
    app.get("/jquery-1.9.1.min.js", common.staticHandler("./games/risiko/js/jquery-1.9.1.min.js"));
    app.get("/jquery-migrate-1.2.1.min.js", common.staticHandler("./games/risiko/js/jquery-migrate-1.2.1.min.js"));
    app.get("/jquery.easing.1.3.js", common.staticHandler("./games/risiko/js/jquery.easing.1.3.js"));
    app.get("/jquery.fancybox.pack-v=2.1.5.js", common.staticHandler("./games/risiko/js/jquery.fancybox.pack-v=2.1.5.js"));
    app.get("/script.js", common.staticHandler("./games/risiko/js/script.js"));
    app.get("/bootstrap.min.js", common.staticHandler("./games/risiko/js/bootstrap.min.js"));
    app.get("/bootstrap-acknowledgeinput.min.js", common.staticHandler("./games/risiko/js/bootstrap-acknowledgeinput.min.js"));
    app.get("/tokeninput.js", common.staticHandler("./games/risiko/js/jquery.tokeninput.js"));
    app.get("/date.js", common.staticHandler("./games/risiko/js/date-it-IT.js"));
    app.get("/intro", common.staticHandler("./games/risiko/js/intro.min.js"));
    app.get("/account-intro.js", common.staticHandler("./games/risiko/js/account-intro.js"));
    app.get("/pnotify.js", common.staticHandler("./games/risiko/js/jquery.pnotify.js"));
    app.get("/feedback.js", common.staticHandler("./games/risiko/js/jquery.feedback_me.js"));
    //OLDBOOSTRAP JS
    app.get("/bootstrapv2.min.js", common.staticHandler("./games/risiko/js/oldbootstrap/bootstrapv2.min.js"));
    // RISIKO
    app.get("/mapiconmaker.js", common.staticHandler("./games/risiko/js/mapiconmaker.js"));
    app.get("/infobubble", common.staticHandler("./games/risiko/js/infobubble.js"));
    app.get("/debellum-intro.js", common.staticHandler("./games/risiko/js/debellum-intro.js"));
    app.get("/map", common.staticHandler("./games/risiko/js/map.js"));
    app.get("/scrollbar", common.staticHandler("./games/risiko/js/jquery.contentcarousel.js"));
    app.get("/mousewheel", common.staticHandler("./games/risiko/js/jquery.mousewheel.min.js"));
    app.get("/sound-effect-manager.js", common.staticHandler("./games/risiko/js/sound-effect-manager.js"));

    // CSS
    app.get("/bootstrap.min.css", common.staticHandler("./css/bootstrap.min.css"));
    app.get("/bootstrap-responsive.min.css", common.staticHandler("./css/bootstrap-responsive.css"));
    app.get("/font-awesome.min.css", common.staticHandler("./css/font-awesome.min.css"));
    app.get("/style.css", common.staticHandler("./css/style.css"));
    app.get("/jquery.fancybox-v=2.1.5.css", common.staticHandler("./css/jquery.fancybox-v=2.1.5.css"));
    app.get("/pnotify.css", common.staticHandler("./css/jquery.pnotify.default.css"));
    app.get("/pnotify.icons.css", common.staticHandler("./css/jquery.pnotify.default.icons.css"));
    app.get("/token-input.css", common.staticHandler("./css/token-input.css"));
    app.get("/token-input-fb.css", common.staticHandler("./css/token-input-facebook.css"));
    app.get("/feedback.css", common.staticHandler("./css/jquery.feedback_me.css"));
    app.get("/intro.css", common.staticHandler("./css/introjs.min.css"));
    app.get("/index.css", common.staticHandler("./css/index.css"));
    //OLDBOOSTRAP CSS
    app.get("/bootstrapv2.min.css", common.staticHandler("./css/oldbootstrap/bootstrapv2.min.css"));
    app.get("/bootstrap-responsivev2.min.css", common.staticHandler("./css/oldbootstrap/bootstrap-responsivev2.min.css"));
    // CSS RISIKO
    app.get("/map.css", common.staticHandler("./css/map.css"));
    app.get("/scrollbar.css", common.staticHandler("./css/jquery.jscrollpane.css"));

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

    //FONTS
    app.get("/fontawesome-webfont-.eot", common.staticHandler("./font/fontawesome-webfont-.eot"));
    app.get("/fontawesome-webfont-v=3.2.1.eot", common.staticHandler("./font/fontawesome-webfont-v=3.2.1.eot"));
    app.get("/fontawesome-webfont-v=3.2.1.ttf", common.staticHandler("./font/fontawesome-webfont-v=3.2.1.ttf"));
    app.get("/fontawesome-webfont-v=3.2.1.woff", common.staticHandler("./font/fontawesome-webfont-v=3.2.1.woff"));
    app.get("/fontawesome-webfont.svg", common.staticHandler("./font/fontawesome-webfont.svg"));

    //NEW IMMAGINI
    app.get("/bg3.png", common.staticHandler("./images/bg3.png"));
    app.get("/s01.png", common.staticHandler("./images/s01.png"));
    app.get("/s02.png", common.staticHandler("./images/s02.png"));
    app.get("/s03.png", common.staticHandler("./images/s03.png"));
    app.get("/client01.png", common.staticHandler("./images/client01.png"));
    app.get("/client02.png", common.staticHandler("./images/client02.png"));
    app.get("/client03.png", common.staticHandler("./images/client03.png"));
    app.get("/client04.png", common.staticHandler("./images/client04.png"));
    app.get("/client05.png", common.staticHandler("./images/client05.png"));
    app.get("/website-arrows.png", common.staticHandler("./images/website-arrows.png"));

    // IMMAGINI
    app.get("/chrome", common.staticHandler("./images/google-chrome.png"));
    app.get("/seatFree", common.staticHandler("./images/seatFree.png"));
    app.get("/seatBusy", common.staticHandler("./images/seatBusy.png"));
    app.get("/play", common.staticHandler("./images/play.png"));
    app.get("/loading-small", common.staticHandler("./images/loading-small.gif"));
    app.get("/user_add", common.staticHandler("./images/glyphicons_006_user_add.png"));
    app.get("/user_remove", common.staticHandler("./images/glyphicons_007_user_remove.png"));
    app.get("/logo_small", common.staticHandler("./images/logo_small.png"));
    app.get("/logo", common.staticHandler("./images/logo.png"));
    app.get("/beta", common.staticHandler("./images/beta.png"));
    app.get("/facebook_login", common.staticHandler("./images/facebook_login.png"));
    app.get("/facebook_login_p", common.staticHandler("./images/facebook_login_p.png"));
    app.get("/sprites", common.staticHandler("./images/sprites.png"));
    app.get("/google_login", common.staticHandler("./images/google_login.png"));
    app.get("/google_login_h", common.staticHandler("./images/google_login_h.png"));
    app.get("/google_login_p", common.staticHandler("./images/google_login_p.png"));
    app.get("/facebook_share", common.staticHandler("./images/facebook_share.png"));
    app.get("/google_share", common.staticHandler("./images/google_share.png"));

    // IMMAGINI PARTITA RISIKO
    app.get("/dice1", common.staticHandler("./images/risiko/1.png"));
    app.get("/dice2", common.staticHandler("./images/risiko/2.png"));
    app.get("/dice3", common.staticHandler("./images/risiko/3.png"));
    app.get("/dice4", common.staticHandler("./images/risiko/4.png"));
    app.get("/dice5", common.staticHandler("./images/risiko/5.png"));
    app.get("/dice6", common.staticHandler("./images/risiko/6.png"));
    app.get("/dice1r", common.staticHandler("./images/risiko/1r.png"));
    app.get("/dice2r", common.staticHandler("./images/risiko/2r.png"));
    app.get("/dice3r", common.staticHandler("./images/risiko/3r.png"));
    app.get("/dice4r", common.staticHandler("./images/risiko/4r.png"));
    app.get("/dice5r", common.staticHandler("./images/risiko/5r.png"));
    app.get("/dice6r", common.staticHandler("./images/risiko/6r.png"));
    app.get("/dice1g", common.staticHandler("./images/risiko/1g.png"));
    app.get("/dice2g", common.staticHandler("./images/risiko/2g.png"));
    app.get("/dice3g", common.staticHandler("./images/risiko/3g.png"));
    app.get("/dice4g", common.staticHandler("./images/risiko/4g.png"));
    app.get("/dice5g", common.staticHandler("./images/risiko/5g.png"));
    app.get("/dice6g", common.staticHandler("./images/risiko/6g.png"));
    app.get("/left", common.staticHandler("./images/risiko/leftB.png"));
    app.get("/right", common.staticHandler("./images/risiko/rightB.png"));
    app.get("/up", common.staticHandler("./images/risiko/up.png"));
    app.get("/down", common.staticHandler("./images/risiko/down.png"));
    app.get("/users", common.staticHandler("./images/risiko/users.png"));
    app.get("/notes", common.staticHandler("./images/risiko/notes.png"));
    app.get("/dices", common.staticHandler("./images/risiko/dices2.gif"));
    app.get("/arrow",  common.staticHandler("./images/risiko/arrow.gif"));
    app.get("/arrow2",  common.staticHandler("./images/risiko/arrow_rev.gif"));
    app.get("/arrow3",  common.staticHandler("./images/risiko/arrow_rev_up.gif"));
    app.get("/arrow4",  common.staticHandler("./images/risiko/arrow_up.gif"));
    app.get("/cards", common.staticHandler("./images/risiko/glyphicons_319_sort.png"));
    app.get("/carousel_btns.png", common.staticHandler("./images/risiko/carousel_btns.png"));
    app.get("/shadow.png", common.staticHandler("./images/risiko/shadow.png"));
    app.get("/arrows.png", common.staticHandler("./images/risiko/arrows.png"));
    app.get("/cross.png", common.staticHandler("./images/risiko/cross.png"));
    app.get("/template", common.staticHandler("./images/risiko/card_template.png"));
    app.get("/atomic", common.staticHandler("./images/risiko/atomic.png"));
    app.get("/alleanza", common.staticHandler("./images/risiko/alleanza.png"));
    app.get("/attaccoAereo", common.staticHandler("./images/risiko/attaccoAereo.jpg"));
    app.get("/attaccoTerra", common.staticHandler("./images/risiko/attaccoTerra.png"));
    app.get("/cecchino", common.staticHandler("./images/risiko/cecchino.jpg"));
    app.get("/sabotaggio", common.staticHandler("./images/risiko/sabotaggio.jpg"));
    app.get("/spyCard", common.staticHandler("./images/risiko/spy.jpg"));
    app.get("/difesaCard", common.staticHandler("./images/risiko/difesaCard.jpg"));
    app.get("/attaccoCard", common.staticHandler("./images/risiko/attaccoCard.png"));
    app.get("/epidemia", common.staticHandler("./images/risiko/epidemia.jpg"));
    app.get("/close.png", common.staticHandler("./images/risiko/close.png"));
    app.get("/scudo", common.staticHandler("./images/risiko/glyphicons_270_shield.png"));
    app.get("/conquered_small", common.staticHandler("./images/risiko/conquered_small.png"));
    app.get("/plus1", common.staticHandler("./images/risiko/piu1.png"));
    app.get("/main", common.staticHandler("./images/risiko/main.jpg"));
    app.get("/leave_match", common.staticHandler("./images/risiko/glyphicons_063_power.png"));
    app.get("/help", common.staticHandler("./images/risiko/glyphicons_195_circle_info.png"));
    app.get("/thumbnails", common.staticHandler("./images/risiko/thumbnails.png"));
    app.get("/notes", common.staticHandler("./images/risiko/notes.png"));
    app.get("/user", common.staticHandler("./images/risiko/glyphicons_003_user.png"));
    app.get("/bug", common.staticHandler("./images/risiko/glyphicons_360_bug.png"));
    app.get("/connected", common.staticHandler("./images/risiko/connected.png"));
    app.get("/disconnected", common.staticHandler("./images/risiko/disconnected.png"));
    app.get("/glyphicons-halflings.png", common.staticHandler("./images/bootstrap/glyphicons-halflings.png"));
    app.get("/glyphicons-halflings-white.png", common.staticHandler("./images/bootstrap/glyphicons-halflings-white.png"));


};