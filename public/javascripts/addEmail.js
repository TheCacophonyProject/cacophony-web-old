/* global user */
/* global displayAlert */

window.onload = function() {
  $("#addEmail").click(addEmail);
  if (user.getAttr('email')) {
    window.location.href = '/';
  }
};

async function addEmail(event) {
  event.preventDefault();
  var data = {
    email: document.getElementById('inputEmail').value
  };

  try {
    await user.updateFields(data);
    user.updateUserData();
  } catch (err) {
    displayAlert("Failed to update email: " + err.responseJSON.message);
  }
}
