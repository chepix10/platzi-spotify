import fetch from 'isomorphic-fetch'
import generateRandomString from '../utils/generateRandomString'
import scopesArray from '../utils/scopesArray'
import getHashParams from '../utils/getHashParams'
import { config } from '../config/client'

export default class AuthService {
  constructor () {
    this.login = this.login.bind(this)
    this.logout = this.logout.bind(this)
    this.handleAuthentication = this.handleAuthentication.bind(this)
    this.isAuthenticated = this.isAuthenticated.bind(this)
    this.getProfile = this.getProfile.bind(this)
  }

  login () {
    const state = generateRandomString(16)
    window.localStorage.setItem('auth_state', state)

    let url = 'https://accounts.spotify.com/authorize'
    url += '?response_type=token'
    url += '&client_id=' + encodeURIComponent(config.spotifyClientId)
    url += '&scope=' + encodeURIComponent(scopesArray.join(' '))
    url += '&redirect_uri=' + encodeURIComponent(config.spotifyRedirectUri)
    url += '&state=' + encodeURIComponent(state)

    window.location.href = url
  }

  logout () {
    // clear access token, id token and profile
    window.localStorage.removeItem('access_token')
    window.localStorage.removeItem('id_token')
    window.localStorage.removeItem('expires_at')
    window.localStorage.removeItem('profile')
  }

  handleAuthentication () {
    return new Promise((resolve, reject) => {
      const { access_token: accessToken, state } = getHashParams()
      const authState = window.localStorage.getItem('auth_state')

      if (state === null || state !== authState) {
        reject(new Error("The state doesn't match"))
      }

      window.localStorage.removeItem('auth_state')

      if (accessToken) {
        this.setSession({ accessToken })
        return resolve(accessToken)
      } else {
        return reject(new Error('The token is invalid'))
      }
    }).then(accessToken => {
      return this.handleUserInfo(accessToken)
    })
  }

  setSession (authResult) {
    const expiresAt = JSON.stringify(
      authResult.expiresIn * 1000 + new Date().getTime()
    )

    window.localStorage.setItem('access_token', authResult.accessToken)
    window.localStorage.setItem('expires_at', expiresAt)
  }

  isAuthenticated () {
    const expiresAt = JSON.parse(window.localStorage.getItem('expires_at'))
    return new Date().getTime() < expiresAt
  }

  handleUserInfo (accessToken) {
    const headers = {
      Authorization: `Bearer ${accessToken}`
    }

    return fetch('https://api.spotify.com/v1/me', { headers })
      .then(response => response.json())
      .then(profile => {
        this.setProfile(profile)
        return profile
      })
  }

  setProfile (profile) {
    window.localStorage.setItem('profile', JSON.stringify(profile))
  }

  getProfile () {
    const profile = window.localStorage.getItem('profile')
    return profile ? JSON.parse(window.localStorage.profile) : {}
  }
}
