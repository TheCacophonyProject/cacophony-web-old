window.onload = function() {
  $("#login").click(login);
};

function login() {
  user.login(document.getElementById('inputPassword').value, document.getElementById('inputUsername').value)
}
