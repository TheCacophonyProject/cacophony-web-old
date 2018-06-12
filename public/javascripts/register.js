/* global user */

window.onload = function() {
  $("#register").click(register);
  document.getElementById('password').addEventListener('input', passwordCheck);
  document.getElementById('passwordRetype').addEventListener('input', passwordCheck);
};

function register() {
  user.register(
    document.getElementById("password"),
    document.getElementById("passwordRetype"),
    document.getElementById("username")
  );
}

function passwordCheck() {
  let password = document.getElementById('password');
  let passwordRetype = document.getElementById('passwordRetype');
  if (password.value === passwordRetype.value) {
    passwordRetype.classList.remove('invalid');
  } else {
    passwordRetype.classList.add('invalid');
  }
}
