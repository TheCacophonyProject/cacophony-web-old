/*
  Javascript for the top navigation bar.
*/

// Change what the navbar displays if a user is logged in or not.
if (user.isLoggedIn()) {
  document.getElementById('navbar-logout').onclick = user.logout;
  document.getElementById('navbar-hello-user').innerText =
    'Hello ' + user.get("username");
  $("#navbar-user-details").show();
} else {
  $("#navbar-login").show();
}

// Changes the navbar to show what page is open.
for (var i in document.getElementById('navbar-links').children) {
  var link = document.getElementById('navbar-links').children[i];
  if (link.tagName == "LI" && link.children[0].href == window.location)
    link.setAttribute('class', 'active');
}
