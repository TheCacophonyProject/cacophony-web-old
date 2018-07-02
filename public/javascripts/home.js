/* global user */
/* exported newGroup */

window.onload = function() {
  document.getElementById('username').innerText = user.getAttr("username");
  document.getElementById('greeting').innerText = 'Kia ora ' + (user.getAttr('firstName') || user.getAttr('username'));
  hideBlankUserFields('firstName');
  hideBlankUserFields('lastName');
  hideBlankUserFields('email');
  document.getElementById('groups').innerText = getGroupsListText();
};

function getGroupsListText() {
  var groups = [];
  var userGroups = user.getAttr("groups");
  for (var i in userGroups) {
    groups.push(userGroups[i].groupname);
  }
  return groups.join(', ');
}

function newGroup() {
  window.location.assign('/new_group');
}

function hideBlankUserFields(field) {
  let value = user.getAttr(field);
  if (value) {
    document.getElementById(field).innerText = value;
  } else {
    document.getElementById(field + '-label').style.display = 'none';
  }
}
