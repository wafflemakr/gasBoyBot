const axios = require("axios");

const gasStation = axios.create({
  baseURL: `https://ethgasstation.info/json/ethgasAPI.json?api-key=${process.env.GAS_STATION_API}`,
});
module.exports = { gasStation };
