var Reminder = require("reminder");
var sessionManager = require("./sessionManager");
var db = require("../../db/accessDB").getDBInstance;
var util = require("util");
var dateutils = require("date-utils");
var memwatch = require('memwatch');

var DeamonReminder = new Reminder();

//metodi di controllo della memoria
memwatch.on('leak', function(info) {
	util.log("[memory leak check]: "+util.inspect(info,true));
});

/*
memwatch.on('stats', function(stats) {
	util.log("[heap usage check]: "+util.inspect(stats,true));
});
*/

//Demone controllo partite in memoria
DeamonReminder.every('minute', function(date){

	util.log("[reminder matches in memory]: running at "+new Date());


	var matchesInMemory = sessionManager.getMatchList().getMatchesList();
	var ids = [];
	for(var i=0;i<matchesInMemory.length;i++){
		ids.push(matchesInMemory[i].getId());
	}
	util.log("[reminder matches in memory]: numero di matches rilevati in memoria: "+ids.length);

	if ( ids.length > 0 ){
		util.log("[reminder matches in memory]: controllo delle date di salvataggio in corso...");

		db.getMatches({_id: { $in: ids }, running: true, winner: null}, null, function(err, list){
			if ( err ){
				util.log("[reminder matches in memory]: errore: "+err);
				return;
			}

			var hd = new memwatch.HeapDiff();

			for(var idx in list){
				var match = list[idx];

				var matchDate = match.frozen.created_at;
				var now = new Date();
				now.addHours(-24);

				if ( matchDate.isBefore(now) ){

					util.log("[reminder matches in memory]: rimozione del match [id: "+match.id+"][created_at: "+match.frozen.created_at+"]");
					match = null;
					delete match;

				}
				else{
					util.log("[reminder matches in memory]: il match "+match.id+" rimane in memoria[created_at: "+match.frozen.created_at+"]");
				}

				

			}

			var diff = hd.end();
			util.log("[heap usage after GC called]: "+util.inspect(diff));
			util.log("[heap usage after GC called]: details: "+util.inspect(diff.change.details,true));

		});

	}

});