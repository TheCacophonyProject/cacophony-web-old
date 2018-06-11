/* global api, Promise */
/* exported user */

var user = {};

user.logout = function() {
  localStorage.removeItem('userData');
  localStorage.removeItem('JWT');
  window.location.href = '/';
};

user.login = function(password, username) {
  $.ajax({
    url: api + '/authenticate_user',
    type: 'post',
    data: "password=" + password + "&username=" + username,
    success: function(res) {
      localStorage.setItem('JWT', res.token);
      localStorage.setItem('userData', JSON.stringify(res.userData));
      window.location.assign("/user_home");
    },
    error: function() {
      document.getElementById('inputUsername').value = '';
      document.getElementById('inputPassword').value = '';
      window.alert('login failed');
    }
  });
};

user.register = function(passEle1, passEle2, usernameEle) {

  var password1 = passEle1.value;
  var password2 = passEle2.value;
  var username = usernameEle.value;

  if (username.length < 5) {
    passEle1.value = "";
    passEle2.value = "";
    window.alert("Username not long enough.");
    return;
  }
  if (password1.length < 5) {
    passEle1.value = "";
    passEle2.value = "";
    window.alert("Password not long enough.");
    return;
  }
  if (password1 != password2) {
    passEle1.value = "";
    passEle2.value = "";
    window.alert("Passwords don't match.");
    return;
  }

  $.ajax({
    url: api + '/api/v1/Users',
    type: 'post',
    data: "password=" + password1 + "&username=" + username,
    success: function(res) {
      localStorage.setItem('userData', JSON.stringify(res.userData));
      localStorage.setItem('JWT', res.token);
      window.location.assign("/user_home");
    },
    error: function(res) {
      console.log("Error");
      console.log(res);
      window.alert("Error with registering a new user.");
    }
  });
};

user.getAllAttrs = function() {
  if (user.isLoggedIn())
  {return JSON.parse(localStorage.getItem('userData'));}
  else
  {return null;}
};

user.getAttr = function(field) {
  if (user.isLoggedIn() == false)
  {return null;}
  else
  {return user.getAllAttrs()[field];}
};

user.isLoggedIn = function() {
  if (JSON.parse(localStorage.getItem('userData')))
  {return true;}
  else
  {return false;}
};

// Returns the JSON Web Token
user.getJWT = function() {
  return localStorage.getItem('JWT');
};

user.updateUserData = function() {
  if (!user.isLoggedIn()) {
    return;
  }
  $.ajax({
    url: api + '/api/v1/users/' + user.getAttr("username"),
    type: 'get',
    headers: { 'Authorization': user.getJWT() },
    success: function(res) {
      localStorage.setItem('userData', JSON.stringify(res.userData));
      window.location.assign('/user_home');
    },
    error: function(err) {
      console.log(err);
      window.alert('Error with loading user data.');
    }
  });
};


user.get = async function(username) {
  if (!user.isLoggedIn()) {
    throw "must be logged in";
  }
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: api + "/api/v1/users/" + username,
      type: 'GET',
      headers: { 'Authorization': user.getJWT() },
      success: (result) => resolve(result.userData),
      error: (resp) => {
        // 422 status means the user doesn't exist.
        if (resp.status == 422) {
          resolve(null);
        }
        return reject(resp.statusText);
      },
    });
  });
};


user.getTagDefaults = function() {
  var defaults = JSON.parse(localStorage.getItem('tagDefaults'));
  if (defaults == undefined)
  {return {};}
  else
  {return defaults;}
};

user.setTagDefault = function(key, val) {
  var defaults = JSON.parse(localStorage.getItem('tagDefaults'));
  if (defaults == undefined || typeof defaults != "object")
  {defaults = {};}
  defaults[key] = val;
  localStorage.setItem('tagDefaults', JSON.stringify(defaults));
};

user.getHeaders = function() {
  var headers = {};
  if (user.isLoggedIn()) {
    headers.Authorization = user.getJWT();
  }
  return headers;
};
