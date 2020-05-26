const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const alertSchema = new Schema({
  user: { type: String, required: true },
  value: { type: Number, required: false },
});

module.exports = mongoose.model("Alert", alertSchema);
