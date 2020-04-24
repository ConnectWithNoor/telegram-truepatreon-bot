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
const mongoose = require('mongoose');

const { InsertUser } = require('./util/functions');
const { loginUrl } = require('./util/utilities');

// initilization
app.use(json());
app.use(urlencoded({ extended: true }));

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
      return apiClient('/current_user');
    })
    .then(async ({ store, rawJson }) => {
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

      // const storePledge = store
      //   .findAll('pledge')
      //   .map((camp) => camp.serialize().data);

      bot.sendMessage(
        msgId,
        `Great. We have found following campaigns assosiated with your account.
          please choose any one campaign from the following list:
          
      ${storeCampaigns.map((camp) => (
        <a href={`${camp}`} alt={`${camp}`}>
          <b>{`123 \n`}</b>
        </a>
      ))}`,
        {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }
      );
      res.status(200).end();
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
