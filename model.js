var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/bbs');
var rsa = mongoose.createConnection('mongodb://localhost/pubkagi');

function validator(v) {
  return v.length > 0;
}

var PostBbs = new mongoose.Schema({
    text   : { type: String, validate: [validator, "Empty Error"] }
  , name   : { type: String, required: true }
  , created: { type: Date, default: Date.now }
});

var PostPubkagi = new mongoose.Schema({
    name   : { type: String, required: true }
  , pass   : { type: String, required: true }
  , pubkey : { type: String, required: true }
  , created: { type: Date, default: Date.now }
})

exports.PostBbs = db.model('Post', PostBbs)
exports.PostPubkagi = rsa.model('PostPubkagi', PostPubkagi)
