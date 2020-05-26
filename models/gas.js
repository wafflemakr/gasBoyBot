const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const gasSchema = new Schema({
  low: { type: Number, default: 0 },
  standard: { type: Number, default: 0 },
  fast: { type: Number, default: 0 },
});

module.exports = mongoose.model("GasData", gasSchema);
