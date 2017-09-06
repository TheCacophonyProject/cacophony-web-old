window.onload = function() {
  $("#register").click(register);
};

function register() {
  user.register(
    document.getElementById("password"),
    document.getElementById("passwordRetype"),
    document.getElementById("username")
  );
}
