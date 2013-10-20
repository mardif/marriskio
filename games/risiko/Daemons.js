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
DeamonReminder.every('12 hours', function(date){

	util.log("[reminder matches in memory]: running at "+new Date());
	var globalhd = new memwatch.HeapDiff();


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

					util.log("1 -> match in memoria: "+sessionManager.getMatchList().getMatchesList().length);

					//riprendo il match dalla matchList
					for(var j=0; j<matchesInMemory.length;j++){
						if ( matchesInMemory[j].getId() == match.id ){

							//matchesInMemory[j] = null;
							//delete matchesInMemory[j];

							var result = sessionManager.getMatchList().removeMatchFromList(match.id);
							util.log("match removed from memory? "+result);

							util.log("[reminder matches in memory]: rimozione del match bean e del match nella matchesList [id: "+match.id+"][created_at: "+match.frozen.created_at+"]");
							match = null;
							delete match;

							break;
						}
					}
					util.log("2 -> match in memoria: "+sessionManager.getMatchList().getMatchesList().length);

				}
				else{
					util.log("[reminder matches in memory]: il match "+match.id+" rimane in memoria[created_at: "+match.frozen.created_at+"]");
				}

				

			}

		});

	}

	var diff = globalhd.end();
	util.log("actual memory occupancy diff: "+util.inspect(diff));

});