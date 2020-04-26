// success page
exports.verifiedPage = (req, res) => {
  res
    .status(200)
    .send(
      'You have been verified. Please close this tab and proceed to the bot'
    );
};

// fallback page
exports.fallbackPage = (req, res) => {
  res
    .status(200)
    .send('Something went Wrong, Please close the tab and try again.');
};
