function buildProfileObject (profile) {
  return {
    id: profile.getId(),
    full_name: profile.getName(),
    given_name: profile.getGivenName(),
    family_name: profile.getFamilyName(),
    image: profile.getImageUrl(),
    email: profile.getEmail()
  }
}

function onSignIn (googleUser) {
  const { id_token: idToken } = googleUser.getAuthResponse()
  const profile = googleUser.getBasicProfile()
  const builtProfile = buildProfileObject(profile)

  window.localStorage.setItem('profile', JSON.stringify(builtProfile))
  window.localStorage.setItem('id_token', idToken)
  window.location.href = '/?hideLogIn=true'
}

function signOut () {
  const auth2 = gapi.auth2.getAuthInstance()
  auth2.signOut().then(() => {
    window.localStorage.removeItem('profile')
    window.localStorage.removeItem('id_token')
    window.location.href = '/'
  })
}
