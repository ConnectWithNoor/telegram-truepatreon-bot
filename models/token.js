var mongoose = require('mongoose');

tokenSchema = new mongoose.Schema({
  userId: String,
  accessToken: String,
  refreshToken: String,
  expiresIn: Number,
});

//MODEL
module.exports = mongoose.model('tokenSchema', tokenSchema);
