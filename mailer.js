global.rootPath = __dirname;

var util = require("util");
var db = require("./db/accessDB").getDBInstance;
var common = require("./games/risiko/common");
//var User = require('./db/models/user');
//var conn = 'mongodb://risikodb:@localhost:27017/risikodb';

var subject, message;

var args = process.argv.splice(2);

db.startup();

function startsWith(str, prefix) {
    return str.indexOf(prefix) === 0;
}

if ( !args || (args && args.length != 2) ){
	util.log("usage: node mailer.js --subject=<subject> --message=\"<message>\"");
	return;
}

for(var idx in args){

	var value = args[idx].substring( args[idx].indexOf( "=" )+1 );
	if ( startsWith(args[idx], "--subject") ){
		subject = value;
	}
	else if ( startsWith(args[idx], "--message") ){
		message = value;
	}
}

if ( !subject ){
	util.log("Missing argv --subject=<subject>\nusage: node mailer.js --subject=<subject> --message=\"<message>\"");
	return;
}
if ( !message ){
	util.log("Missing argv --message=<message>\nusage: node mailer.js --subject=<subject> --message=\"<message>\"");
	return;
}

util.log("ok, si procede!\nsubject: "+subject+"\nmessage: "+message);
util.log("prendo le email");

db.getUsers(null, "email name", function(err, result){
	if ( err ){
		util.log(err);
	}

	var body = common.getHeaderMailTemplate();
	body += "Un saluto dal team di Debellum!<br/><br/>\
	Volevamo farti sapere che abbiamo introdotto una grande novità:<br/>\
	<br/><strong>Per iniziare una partita, <br/>ora non è più necessario che tutti gli utenti<br/>siano online contemporaneamente.</strong><br/>\
	<br/>Ognuno potrà eseguire le proprie azioni<br/> e poi uscire tranquillamente dalla partita:<br/>quando sarà il tuo turno,<br/>\
	sarai avvisato tramite un messaggio<br/>che verrà inviato alla tua email con cui ti sei registrato.<br/>\
	<br/>Se hai intenzione di continuare a giocare come prima in real-time,<br/>nessun problema: potrai continuare a farlo senza alcun problema.<br/><br/>\
	A presto per altre interessanti novità!<br/>";
	body += common.getFooterMailTemplate();

	var addresses = [];
	for(var a in result){
		var n = result[a];
		addresses.push(result[a].email);
	}
	util.log("addresses: "+addresses);

	var headers = {
	   text:    body,
	   from:    "features@debellum.net",
	   bcc:      addresses.join(","),
	   subject: "Debellum: novità in vista!!!"
	};

	common.sendEmail(headers);

});