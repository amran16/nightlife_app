var mongoose = require("mongoose");

var yelpSchema = new mongoose.Schema({
  YelpId: String,
  people: Array
});

module.exports = mongoose.model("YelpInfo", yelpSchema);
