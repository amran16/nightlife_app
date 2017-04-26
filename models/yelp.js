var mongoose = require("mongoose");

var yelpSchema = new mongoose.Schema({
  id: String,
  people: Array
  //date: String
});

module.exports = mongoose.model("YelpInfo", yelpSchema);
