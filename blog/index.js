const express = require('express')
const path = require('path')
const request = require('request')
const querystring = require('querystring')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const generateRandomString = require('./utils/generateRandomString')
const encodeBasic = require('./utils/encodeBasic')
const scopesArray = require('./utils/scopesArray')

const playlistMocks = require('./utils/mocks/playlist')

const { config } = require('./config')

const app = express()

// static files
app.use('/static', express.static(path.join(__dirname, 'public')))

// middlewares
app.use(cors())
app.use(cookieParser())

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// routes
app.get('/', async function (req, res, next) {
  res.render('playlists', {
    playlists: { items: playlistMocks }
  })
})

app.get('/login', (req, res) => {
  const state = generateRandomString(16)

  const queryString = querystring.stringify({
    response_type: 'code',
    client_id: config.spotifyClientId,
    scope: scopesArray.join(' '),
    redirect_uri: config.spotifyRedirectUri,
    state
  })

  res.cookie('auth_state', state, { httpOnly: true })
  res.redirect(`http://accounts.spotify.com/authorize?${queryString}`)
})

app.get('/callback', (req, res, next) => {
  const { code, state } = req.query
  const authState = req.cookies.auth_state

  if (!state || state !== authState) {
    next(new Error("The state doesn't match"))
  }

  res.clearCookie('auth_state')

  const authOptions = {
    url: 'http://accounts.spotify.com/api/token',
    form: {
      code,
      redirect_uri: config.spotifyRedirectUri,
      grant_type: 'authorization_code'
    },
    headers: {
      Authorization: `Basic ${encodeBasic(
        config.spotifyClientId,
        config.spotifyClientSecret
      )}`
    },
    json: true
  }

  request.post(authOptions, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      next(new Error('The token is invalid'))
    }

    res.cookie('access_token', body.access_token, { httpOnly: true })
    res.redirect('/playlist')
  })
})

// server
const server = app.listen(3000, function () {
  console.log(`Listening http://localhost:${server.address().port}`)
})
