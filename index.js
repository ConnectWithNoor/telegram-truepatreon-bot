if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
// Global variables
let msgId = 862535021;
let userDetails = {};
let userPatreonDetails = {};

// imports
const bodyparser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const app = require('express')();
const patreon = require('patreon');
const mongoose = require('mongoose');
const axios = require('axios');

const { loginUrl, InsertUser, getUserData } = require('./util/utilities');
const { verifiedPage, fallbackPage } = require('./routes/index');

// initilization
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

const oAuthClient = patreon.oauth(
  process.env.PATREON_CLINET_ID,
  process.env.PATREON_CLIENT_SECRET
);

const sendHTTPRequest = (method, url, data) => {
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((res) => {
    return res;
  });
};

// Bot
const bot = new TelegramBot(process.env.BOT_TOEKN, { polling: true });
bot.onText(/\/start/, async (msg) => {
  msgId = msg.chat.id;

  await bot.sendMessage(
    msgId,
    `Welcome ${msg.chat.first_name}, 

with @TruePatreonbot you can get access to private patreon-only Telegram communities and create your own.

Please press the button below to get started and verify your Patreon account`
  );

  await bot.sendMessage(msgId, `\u{1F447}`, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Click here to verify',
            url: loginUrl,
            // url: `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${process.env.PATREON_CLINET_ID}&redirect_uri=${process.env.PATREON_REDIRECT_URL}`,
          },
        ],
      ],
    },
  });
});

// APIs END POINTS

// redirect-url
app.get('/api/redirect-url', async (req, res) => {
  const { code } = req.query;

  try {
    // userDetails = await oAuthClient.getTokens(
    //   code,
    //   process.env.PATREON_REDIRECT_URL
    // );

    const getRes = await sendHTTPRequest(
      'POST',
      `https://www.patreon.com/api/oauth2/token?code=${code}&grant_type=authorization_code&client_id=${process.env.PATREON_CLINET_ID}&client_secret=${process.env.PATREON_CLIENT_SECRET}&redirect_uri=${process.env.PATREON_REDIRECT_URL}`
    );
    userDetails = await getRes.json();

    bot.sendMessage(
      msgId,
      'Congragulations, You have been verified successfully \u{2705}.\nWe are now fetching your patreon details.'
    );
    res.redirect('/api/current_user');
  } catch (err) {
    console.log('err in authentication', err);
    res.redirect('/api/fallback');
    bot.sendMessage(
      msgId,
      'Something went wrong while verifying your patreon account \u{1F62B} Please try again'
    );
  }
});

// fetch user's info, campagins and pledges
app.get('/api/current_user', async (req, res) => {
  try {
    const apiClient = patreon.patreon(userDetails.access_token);
    const { store, rawJson } = await apiClient('/current_user');
    const [user, campaigns, pledges] = getUserData(store, rawJson);

    userPatreonDetails = {
      user,
      campaigns,
      pledges,
    };

    userDetails = {
      ...userDetails,
      id: userPatreonDetails.user.id,
    };

    await InsertUser(userDetails);
    bot.sendMessage(msgId, 'Patreon details fetched successfully \u{2705}.');
    res.redirect('/api/verified');
  } catch (err) {
    console.log('err in fetching current_user', err.response);
    res.redirect('/api/fallback');
    bot.sendMessage(
      msgId,
      'Something went wrong while fetching your petreon data \u{1F62B} Please try again'
    );
  }
});

// success page
app.get('/api/verified', verifiedPage);

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
