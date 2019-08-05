import Auth0 from 'auth0-js'
import scopesArray from '../utils/scopesArray'
import { config } from '../config/client'

export default class AuthService {
  auth0 = new Auth0.WebAuth({
    domain: config.auth0Domain,
    clientID: config.auth0ClientId,
    audience: config.auth0ApiAudience,
    redirectUri: config.auth0RedirectUri,
    responseType: 'token id_token',
    scope: scopesArray.join(' ')
  })

  constructor () {
    this.login = this.login.bind(this)
    this.logout = this.logout.bind(this)
    this.handleAuthentication = this.handleAuthentication.bind(this)
    this.isAuthenticated = this.isAuthenticated.bind(this)
    this.getProfile = this.getProfile.bind(this)
  }

  login () {
    this.auth0.authorize()
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
      this.auth0.parseHash((err, authResult) => {
        if (err) {
          return reject(err)
        }

        if (authResult && authResult.accessToken && authResult.idToken) {
          this.setSession(authResult)
          return resolve(authResult.accessToken)
        }
      })
    }).then(accessToken => {
      return this.handleUserInfo(accessToken)
    })
  }

  setSession (authResult) {
    const expiresAt = JSON.stringify(
      authResult.expiresIn * 1000 + new Date().getTime()
    )

    window.localStorage.setItem('access_token', authResult.accessToken)
    window.localStorage.setItem('id_token', authResult.idToken)
    window.localStorage.setItem('expires_at', expiresAt)
  }

  isAuthenticated () {
    const expiresAt = JSON.parse(window.localStorage.getItem('expires_at'))
    return new Date().getTime() < expiresAt
  }

  handleUserInfo (accessToken) {
    return new Promise((resolve, reject) => {
      this.auth0.client.userInfo(accessToken, (err, profile) => {
        if (err) {
          reject(err)
        }

         if (profile) {
           this.setProfile(profile)
           return resolve(profile)
         }
      })
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
