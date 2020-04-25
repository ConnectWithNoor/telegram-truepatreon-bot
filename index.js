if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
// Global variables
let msgId = 862535021;
let userDetails = {};

// imports
const bodyparser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const app = require('express')();
const patreon = require('patreon');
const mongoose = require('mongoose');

const { loginUrl, InsertUser } = require('./util/utilities');
const { successPage, fallbackPage } = require('./routes/index');

// initilization
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

const oAuthClient = patreon.oauth(
  process.env.PATREON_CLINET_ID,
  process.env.PATREON_CLIENT_SECRET
);

// Bot
const bot = new TelegramBot(process.env.BOT_TOEKN, { polling: true });
bot.onText(/\/start/, (msg) => {
  msgId = msg.chat.id;
  bot.sendMessage(
    msgId,
    `Welcome ${msg.chat.first_name}. Such a lovely day.
    To enable me to work, please login with Patreon by <a href="${loginUrl}">Clicking Here.</a>`,
    {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }
  );
});

// REDIRECT URL
app.get('/api/redirect-url', (req, res) => {
  const { code } = req.query;
  return oAuthClient
    .getTokens(code, process.env.PATREON_REDIRECT_URL)
    .then((res) => {
      userDetails = res;
      apiClient = patreon.patreon(userDetails.access_token);
      return apiClient('/current_user/campaigns');
    })
    .then(async ({ store }) => {
      const creator = store
        .findAll('user')
        .map((user) => user.serialize().data);
      const campaigns = store
        .findAll('campaign')
        .map((campaign) => campaign.serialize().data);

      const { id } = creator[0];
      userDetails = {
        ...userDetails,
        id,
      };

      await InsertUser(userDetails);

      await bot.sendMessage(msgId, 'Congragulations, You have been verified');

      await bot.sendMessage(
        msgId,
        `Great. We have found following campaigns assosiated with your account. Please choose any one campaign from the following list:
        ${campaigns.map(
          (camp) =>
            `<a href="${camp.attributes.cover_photo_url}" alt="${camp.attributes.name}"><b>${camp.attributes.name}</b></a>\n`
        )}`,
        {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }
      );
      res.redirect('/api/success');
    })
    .catch((err) => {
      console.log('err in currrent user', err);
      bot.sendMessage(msgId, 'Something went wrong. Please try again ');
      res.redirect('/api/fallback');
    });
});

// success page
app.get('/api/success', successPage);

// fallback page
app.get('/api/fallback', fallbackPage);

mongoose
  .connect(process.env.MONGODB, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => {
    console.log('MongoDB connected');
    return app.listen(process.env.PORT);
  })
  .then((res) => {
    console.log(`server running as ${process.env.PORT}`);
  })
  .catch((err) => {
    console.error(err);
  });
