const { format: formatUrl } = require('url');
const Token = require('../models/token');

exports.InsertUser = async ({
  id,
  access_token,
  refresh_token,
  expires_in,
}) => {
  try {
    const user = await Token.findOne({ userId: id });
    if (user) {
      console.log('user already registered');
      return user;
    } else {
      const newUser = await Token.create({
        userId: id,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
      });
      console.log('new user registered');

      return newUser;
    }
  } catch (err) {
    console.log(err);
  }
};

exports.loginUrl = formatUrl({
  protocol: 'https',
  host: 'patreon.com',
  pathname: '/oauth2/authorize',
  query: {
    response_type: 'code',
    client_id: process.env.PATREON_CLINET_ID,
    redirect_uri: process.env.PATREON_REDIRECT_URL,
    state: 'chills',
  },
});
