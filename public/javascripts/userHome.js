/* global user */
/* exported newGroup */

window.onload = function() {
  document.getElementById('username').innerText = user.getAttr("username");
  document.getElementById('first-name').innerText = user.getAttr("firstname");
  document.getElementById('last-name').innerText = user.getAttr("lastname");
  document.getElementById('email').innerText = user.getAttr("email");
  document.getElementById('groups').innerText = getGroupsListText();
};

function getGroupsListText() {
  var groups = [];
  var userGroups = user.getAttr("groups");
  for (var i in userGroups)
  {groups.push(userGroups[i].groupname);}
  return groups.join(', ');
}

function newGroup() {
  window.location.assign('/new_group');
}
