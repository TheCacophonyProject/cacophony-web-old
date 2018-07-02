/* global api, Promise, next */
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
      if (next === '') {
        window.location.assign('/');
      } else {
        window.location.assign(next);
      }
    },
    error: function() {
      document.getElementById('inputUsername').value = '';
      document.getElementById('inputPassword').value = '';
      displayAlert('Login Error. Please try again.');
    }
  });
};

user.register = function(passEle1, passEle2, usernameEle, event) {

  // Prevent page refresh when submit button pushed
  event.preventDefault();

  var password1 = passEle1.value;
  var password2 = passEle2.value;
  var username = usernameEle.value;

  const usernameLength = 5;
  if (username.length < usernameLength) {
    passEle1.value = "";
    passEle2.value = "";
    displayAlert(`Please choose a username that is at least ${usernameLength} characters long.`);
    return;
  }
  if (password1.length < 8) {
    passEle1.value = "";
    passEle2.value = "";
    displayAlert("Password not long enough.");
    return;
  }
  if (password1 != password2) {
    passEle1.value = "";
    passEle2.value = "";
    displayAlert("Passwords don't match.");
    return;
  }

  $.ajax({
    url: api + '/api/v1/Users',
    type: 'post',
    data: "password=" + password1 + "&username=" + username,
    success: function(res) {
      localStorage.setItem('userData', JSON.stringify(res.userData));
      localStorage.setItem('JWT', res.token);
      window.location.assign("/");
    },
    error: function(res) {
      console.log("Error");
      console.log(res);
      displayAlert("Error with registering a new user.");
    }
  });
};

user.getAllAttrs = function() {
  if (user.isLoggedIn()) {
    return JSON.parse(localStorage.getItem('userData'));
  } else {
    return null;
  }
};

user.getAttr = function(field) {
  if (user.isLoggedIn() == false) {
    return null;
  } else {
    return user.getAllAttrs()[field];
  }
};

user.isLoggedIn = function() {
  if (JSON.parse(localStorage.getItem('userData'))) {
    return true;
  } else {
    return false;
  }
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
      window.location.assign('/');
    },
    error: function(err) {
      console.log(err);
      displayAlert('Error with loading user data.');
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
  if (defaults == undefined) {
    return {};
  } else {
    return defaults;
  }
};

user.setTagDefault = function(key, val) {
  var defaults = JSON.parse(localStorage.getItem('tagDefaults'));
  if (defaults == undefined || typeof defaults != "object") {
    defaults = {};
  }
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

function displayAlert(alertText) {
  // Remove all existing alerts
  let currentAlerts = document.getElementsByClassName('alert');
  for (let alert of currentAlerts) {
    alert.style.display = 'none';
  }
  // Create new alert
  let div = document.createElement('div');
  div.classList.add('alert','alert-warning','alert-dismissible','fade','show');
  div.setAttribute('role', 'alert');
  let button = document.createElement('button');
  button.classList.add('close');
  button.setAttribute('data-dismiss', 'alert');
  button.innerHTML = '&times;';
  let text = document.createTextNode(alertText);
  div.appendChild(button);
  div.appendChild(text);
  let container = document.getElementsByClassName('container');
  container[0].appendChild(div);
}

const noAuthPaths = Object.freeze([
  '/login',
  '/register'
]);

function loginRedirect(pathname) {
  if (noAuthPaths.includes(pathname)) {
    return;
  }
  if (!user.isLoggedIn()) {
    window.location.href = '/login' + '?next=' + encodeURIComponent(pathname);
  }
}

loginRedirect(window.location.pathname);
