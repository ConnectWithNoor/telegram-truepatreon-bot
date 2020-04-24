if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
// Global variables
let msgId = 862535021;
let userDetails = {};

// imports
const json = require('body-parser/lib/types/json');
const urlencoded = require('body-parser/lib/types/urlencoded');
const TelegramBot = require('node-telegram-bot-api');
const app = require('express')();
const patreon = require('patreon');
const { format: formatUrl } = require('url');
const mongoose = require('mongoose');

const { InsertUser } = require('./util/functions');

// // initilization
app.use(json());
app.use(urlencoded({ extended: true }));

const oAuthClient = patreon.oauth(
  process.env.PATREON_CLINET_ID,
  process.env.PATREON_CLIENT_SECRET
);

const loginUrl = formatUrl({
  protocol: 'https',
  host: 'patreon.com',
  pathname: '/oauth2/authorize',
  query: {
    response_type: 'code',
    client_id: process.env.PATREON_CLINET_ID,
    redirect_uri: process.env.PATREON_REDIRECT_URL,
    scope: [
      'campaigns',
      'campaigns.members',
      'campaigns.members[email]',
      'identity.memberships',
    ],
    state: 'chills',
  },
});

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
      // token = access_token; // eslint-disable-line camelcase
      apiClient = patreon.patreon(userDetails.access_token);
      // console.log('token', token);
      return apiClient('/current_user');
    })
    .then(async ({ store, rawJson }) => {
      console.log('in current user');
      const { id } = rawJson.data;
      userDetails = {
        ...userDetails,
        id,
      };
      let user = await InsertUser(userDetails);

      if (!user.expiresIn * 1000 < Date.now()) {
        // TODO: refresh token. accessToken expired
        // user = functionCall()
      }

      bot.sendMessage(msgId, 'Congragulations, You have been verified');

      // const storeUsers = store
      //   .findAll('user')
      //   .map((user) => user.serialize().data);
      const storeCampaigns = store
        .findAll('campaign')
        .map((camp) => camp.serialize().data);

      storeCampaigns.forEach((cam) => console.log(cam));

      // bot.sendMessage(
      //   msgId,
      //   `You have Campaigns:

      //   ${storeCampaigns.map((camp) => camp.attributes.name)}`
      // );
    })
    .catch((err) => {
      console.log('err in currrent user', err);
    });
});

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
