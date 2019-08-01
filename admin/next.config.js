const dotEnvResult = require('dotenv').config()

if (dotEnvResult.error) {
  throw dotEnvResult.error
}

module.exports = {
  env: {
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
    SPOTIFY_REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI
  }
}
