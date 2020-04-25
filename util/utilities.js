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
