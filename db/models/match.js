/** User Schema for CrowdNotes **/

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var util = require("util");

var schemaOptions = {
    toObject: {
      virtuals: true
    }
  };

// Define schema
var MatchSchema = new Schema({
    name: {type: String, required: true},
    players:[{
      player: {type: Schema.ObjectId, ref: 'User'},
      color: {type: String, required: true, default: "#000000"},
      stats: {
        dicesWon: 0,
        dicesLost: 0
      }
    }], //   [{type: Schema.ObjectId, ref: 'User'}],
    started_at: { type: Date, default: Date.now },
    winner: {type: Schema.ObjectId, ref: 'User', default: null},
    running: { type: Boolean, default: false },
    masterPlayer: {type: Schema.ObjectId, ref: 'User'},
    num_players: { type: Number, required: true },
    pause: {type: Boolean, default: false},
    isPublic: {type: Boolean, default: true},
    frozen: { 
        created_at: { type: Date, required: false },
        engine: {type: String, required: false}
    }
}, schemaOptions);

/*
MatchSchema.virtual("playersList").get(function(){
  PlayerMatch.find({match: this._id}).populate("player").exec(function(err, result){
    if (err) throw err;
    console.log("playersList: "+result);
    return result;
  });
}).set(function(args0){});
*/
MatchSchema
.virtual('free')
.get(function () {
  return this.num_players - this.players.length;
})
.set(function (free) {});

MatchSchema.virtual("infos")
.get(function(){
  var info = "<b>Created at</b> "+this.started_at+"<br/>"+
         "<b>created by</b> "+this.masterPlayer.nick+"<br/>"+
         "<b>"+( this.isPublic === true ? "Public" : "Private" )+"</b><br/>"+
         "<b>status</b> "+( this.running === false ? "waiting for players" : ( this.pause === true ? "pause" : "running" ) )+"<br/>"+
         "<b>players already joined:</b> <br/>";
      for(var idx=0; idx < this.players.length; idx++){
        var p = this.players[idx];
          info += "- "+p.player.nick+"<br/>";
      }
      return info;
})
.set(function(info){});

module.exports = mongoose.model('Match', MatchSchema);
