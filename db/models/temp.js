/** User Schema for CrowdNotes **/

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define schema
var TemporarySchema = new Schema({
    email: { type: String, required: true }
  , expire_at: { type: Date, required: true }
  , checkKey: { type: String, required: true }
});


module.exports = mongoose.model('RecoveryPwd', TemporarySchema);
