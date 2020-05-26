const Telegraf = require("telegraf");
const extra = require("telegraf/extra");
const mongoose = require("mongoose");
const args = require("./middlewares/args");
const Alert = require("./models/alerts");
const GasData = require("./models/gas");
const { gasStation } = require("./axios");

require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// Database
const dbURI = process.env.MONGO_URI;
mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected. Launching Bot...");
    bot.launch();
  })
  .catch((e) => {
    console.log(e);
    process.exit(1); // kill process if could not connect to mongoDB
  });

bot.use(args());

bot.start(({ reply, from }) =>
  reply(`Welcome ${from.username}! See /help for available commands`)
);

bot.command("set", async (ctx) => {
  const gasAlert = ctx.state.command.args[0];
  const alert = await Alert.findOne({ user: ctx.from.id });

  if (alert) {
    alert.value = gasAlert;
    await alert.save();
    ctx.reply(`Updating alert to ${gasAlert} Gwei`);
  } else {
    const newAlert = new Alert({
      user: ctx.from.id,
      value: gasAlert,
    });

    await newAlert.save();
    ctx.reply(`Creating alert for ${gasAlert} Gwei`);
  }
});

bot.command("get", async (ctx) => {
  const alert = await Alert.findOne({ user: ctx.from.id });

  if (alert) ctx.reply(`You have an alert for ${alert.value} Gwei`);
  else ctx.reply(`You don't have any alerts yet`);
});

bot.command("last", async (ctx) => {
  const data = await GasData.find();
  const gasPrices = data.pop();

  ctx.replyWithMarkdown(`*Current Gas Prices:*
    Low: ${gasPrices.low}
    Standard: ${gasPrices.standard}
    Fast: ${gasPrices.fast}    
    `);
});

bot.command("help", ({ replyWithMarkdown }) => {
  replyWithMarkdown(`*Available commands:*
    /set <gasPrice> - set an alert for a given gasPrice
    /get - Get your current gas price alert value
    /last - Get last gas price values fetched
    `);
});

const checkGasPrices = async () => {
  const { data } = await gasStation.get("/");
  const low = data.safeLow / 10;
  const standard = data.average / 10;
  const fast = data.fast / 10;

  const newData = new GasData({
    low,
    standard,
    fast,
  });

  await newData.save();

  const alerts = await Alert.find();

  for (let i = 0; i < alerts.length; i++) {
    const alert = alerts[i];
    if (low < alert.value) {
      bot.telegram.sendMessage(
        alert.user,
        `*ALERT! Gas Prices below ${alert.value} Gwei*
          _SafeLow_: ${low}
          _Standard_: ${standard}
          _Fast_: ${fast}`,
        extra.markdown()
      );
      await alert.delete();
    }
  }
};

checkGasPrices();
setInterval(() => checkGasPrices(), process.env.ALERT_INTERVAL);
