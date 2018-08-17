var mongoose = require("mongoose");

var yelpSchema = new mongoose.Schema({
  YelpId: String,
  person: Array
});

module.exports = mongoose.model("YelpInfo", yelpSchema);
