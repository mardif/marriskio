'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', [])
    .service('fakeMatchProvider', function() {
    	this.getMatches = function(user){
    		return { "__v" : 0, "_id" : ObjectId("52810673180984e20d000002"), "isPublic" : true, "masterPlayer" : ObjectId("5280f1c76a22cab60f000003"), "name" : "Prova6", "num_players" : 4, "pause" : false, "players" : [ 	{ 	"player" : ObjectId("5280f1c76a22cab60f000003"), 	"_id" : ObjectId("52810673180984e20d000003"), 	"color" : "#26ad1f" } ], "running" : false, "started_at" : ISODate("2013-11-11T16:31:47.688Z"), "winner" : null };
    	}
    })
  	.value('version', '0.1');
