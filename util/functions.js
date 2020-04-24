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
