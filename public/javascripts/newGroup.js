/* global api, user */

window.onload = function() {
  $("#new-group").click(newGroup);
};

function newGroup() {
  if (!user.isLoggedIn()) {
    window.alert('Please log in before making a new group');
    return;
  }
  var groupname = document.getElementById('group-name').value;

  if (!groupname) {
    window.alert('invalid group name');
    return;
  }

  $.ajax({
    url: api + '/api/v1/groups',
    type: 'post',
    data: 'groupname=' + groupname,
    headers: { 'Authorization': user.getJWT() },
    success: user.updateUserData,
    error: newGroupError
  });
}

function newGroupError(err) {
  // Try to extract the error for the groupname field.
  var nameErr;
  try {
    nameErr = err.responseJSON.errors.groupname.msg;
  } catch(error) {
    // ignore
  }

  var msg = "Failed to add group";
  if (nameErr !== null) {
    msg = msg + ": " + nameErr;
  }
  window.alert(msg);
}
