window.onload = function() {
  document.getElementById('username').innerText = user.get("username");
  document.getElementById('first-name').innerText = user.get("firstname");
  document.getElementById('last-name').innerText = user.get("lastname");
  document.getElementById('email').innerText = user.get("email");
  document.getElementById('groups').innerText = getGroupsListText();
};

function getGroupsListText() {
  var groups = [];
  var userGroups = user.get("groups");
  for (var i in userGroups)
    groups.push(userGroups[i].groupname);
  return groups.join(', ');
}

function userRequestError(res) {
  console.log('Request Error');
  console.log(res);
}

function newGroup() {
  window.location.assign('/new_group');
}
