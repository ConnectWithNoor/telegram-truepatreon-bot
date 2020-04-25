const { format: formatUrl } = require('url');

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

exports.refreshTokenUrl = formatUrl({
  protocol: 'https',
  host: 'patreon.com',
  pathname: '/oauth2/token',
  query: {
    grant_type: 'refresh_token',
    client_id: process.env.PATREON_CLINET_ID,
    client_secret: process.env.PATREON_CLIENT_SECRET,
  },
});
