window.onload = function() {
  $("#new-group").click(newGroup);
};

function newGroup() {
  if (!user.isLoggedIn()) {
    window.alert('No user data found, please log in before making a new Group.');
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
  console.log(err);
  window.alert(err);
}
