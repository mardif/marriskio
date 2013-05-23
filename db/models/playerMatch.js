/** PlayerMatch Schema for CrowdNotes **/

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schemaOptions = {
    toObject: {
      virtuals: true
    }
  };

// Define schema
var PlayerMatchSchema = new Schema({
    player: {type: Schema.ObjectId, ref: 'User'},
    match: {type: Schema.ObjectId, ref: 'Match'},
    color: {type: String, required: true},
    stats: {
      dicesWon: 0,
      dicesLost: 0
    }
}, schemaOptions);

module.exports = mongoose.model('PlayerMatch', PlayerMatchSchema);
