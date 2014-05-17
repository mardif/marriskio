'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('account.services', [])
    .service('fakeMatchProvider', function() {
    	this.getMatches = function(user){
    		return { "isPublic" : true, "masterPlayer" : "5280f1c76a22cab60f000003", "name" : "Prova6", "num_players" : 4, "pause" : false, "players" : [ 	{ 	"player" : "5280f1c76a22cab60f000003", 	"color" : "#26ad1f" } ], "running" : false, "started_at" : "2013-11-11T16:31:47.688Z", "winner" : null };
    	}
    })
  	.value('version', '0.1');
