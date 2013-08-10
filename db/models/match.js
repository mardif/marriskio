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
    }],
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
    var info;
    if ( this.winner ){
        info = "<div>"+
        "<p class='small'><b>Creata il</b> "+this.started_at+"</p>"+
        "<p class='small'><b>Stato</b>: Terminata</p>"+
        "<p class='small'><b>Vincitore</b>: "+this.winner.nick+"</p>"+
        "<p class='small'><b>Giocatori</b>:"+
        "<ul>";
          for(var idx=0; idx < this.players.length; idx++){
            var p = this.players[idx];
              info += "<li>"+p.player.nick+"</li>";
          }
         info += "</ul></p></div>";
    }
    else{
        info = "<div>"+
             "<p class='small'><b>Creata il</b> "+this.started_at+"</p>"+
             "<p class='small'><b>Creatore</b>: "+this.masterPlayer.nick+"</p>";
        if ( this.frozen.created_at ){
            info += "<p class='small'><b>Ultimo salvataggio</b>: "+this.frozen.created_at+"</p>";
        }
        info += "<p class='small'><b>"+( this.isPublic === true ? "Publica" : "Privata" )+"</b></p>"+
             "<p class='small'><b>Stato</b> "+( this.running === false ? "in attesa di giocatori" : ( this.pause === true ? "pausa" : "running" ) )+"</p>"+
             "<p class='small'><b>Giocatori partecipanti:</b>"+
             "<ul>";
          for(var idx=0; idx < this.players.length; idx++){
            var p = this.players[idx];
              info += "<li id='"+p.id+"'>"+p.player.nick+"</li>";
          }
          info += "</ul></p></div>";
    }
    return info;
})
.set(function(info){});

module.exports = mongoose.model('Match', MatchSchema);
