const express = require('express')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const request = require('request')
const { config } = require('./config/index')

const encodeBasic = require('./utils/encodeBasic')

const app = express()

app.use(bodyParser.json())

const getUserPlaylists = (accessToken, userId) => {
  if (!accessToken || !userId) {
    return Promise.resolve(null)
  }

  const options = {
    url: `https://api.spotify.com/v1/users/${userId}/playlists`,
    headers: { Authorization: `Bearer ${accessToken}` },
    json: true
  }

  return new Promise((resolve, reject) => {
    request.get(options, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        reject(error)
      }

      resolve(body)
    })
  })
}

const getUserTweets = (accessToken, userId) => {
  if (!accessToken || !userId) {
    return Promise.resolve(null)
  }

  let url = 'https://api.twitter.com/1.1/tweets/search/fullarchive/dev.json'
  url = url + `?query=${encodeURIComponent('from:' + userId)}`
  url = url + `&fromDate=${encodeURIComponent(201001010000)}`
  url = url + `&toDate=${encodeURIComponent(201901010000)}`

  const options = {
    url,
    headers: { Authorization: `Bearer ${accessToken}` },
    json: true
  }

  return new Promise((resolve, reject) => {
    request.get(options, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        reject(error)
      }

      resolve(body)
    })
  })
}

app.post('/api/auth/token', (req, res) => {
  const { email, username, name } = req.body
  const token = jwt.sign({ sub: username, email, name }, config.authJwtSecret)
  res.json({ access_token: token })
})

app.get('/api/auth/verify', (req, res, next) => {
  const { access_token: accessToken } = req.query

  try {
    const decoded = jwt.verify(accessToken, config.authJwtSecret)
    res.json({ message: 'The access token is valid', username: decoded.sub })
  } catch (err) {
    next(err)
  }
})

app.get('/api/playlists', async (req, res, next) => {
  const { userId } = req.query

  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      Authorization: `Basic ${encodeBasic(
        config.spotifyClientId,
        config.spotifyClientSecret
      )}`
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  }

  request.post(authOptions, async (error, response, body) => {
    if (error || response.statusCode !== 200) {
      next(error)
    }

    const accessToken = body.access_token
    const userPlaylists = await getUserPlaylists(accessToken, userId)
    res.json({ playlists: userPlaylists })
  })
})

app.get('/api/tweets', async (req, res, next) => {
  const { userId } = req.query

  const authOptions = {
    url: 'https://api.twitter.com/oauth2/token',
    headers: {
      Authorization: `Basic ${encodeBasic(
        config.twitterClientId,
        config.twitterClientSecret
      )}`
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  }

  request.post(authOptions, async (error, response, body) => {
    if (error || response.statusCode !== 200) {
      next(error)
    }

    const accessToken = body.access_token
    const userTweets = await getUserTweets(accessToken, userId)
    res.json({ tweets: userTweets })
  })
})

const server = app.listen(5000, () => {
  console.log(`Listening http://localhost:${server.address().port}`)
})
