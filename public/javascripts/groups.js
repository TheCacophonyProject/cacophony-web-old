const groupsApiUrl = api + '/api/v1/groups';
const usersApiUrl = api + '/api/v1/users';
const groupUsersApiUrl = api + '/api/v1/groups/users';
const params = new URLSearchParams(location.search);

window.onload = function() {
  updateGroupTitle();
  loadGroups();
  loadGroupUsers();
}

function updateGroupTitle() {
  const title = document.getElementById('group-title');
  const groupname = params.get('groupname');
  if (groupname == null) {
    title.innerHTML = 'Groups'
  } else {
    title.innerHTML = 'Group ' + groupname;
  }
}

async function loadGroups() {
  var groups = await getGroups({});
  clearTable('groups-table');
  for (var i in groups) {
    addGroupToTable(groups[i]);
  }
}

function addGroupToTable(group) {
  var table = document.getElementById('groups-table');
  var newRow = table.insertRow(table.rows.length);
  var groupIdTd = document.createElement('td');
  groupIdTd.innerHTML = group.id;
  newRow.appendChild(groupIdTd);
  var groupnameLink = document.createElement('a');
  const paramsTemp = new URLSearchParams(location.search);
  paramsTemp.set('groupname', group.groupname);
  groupnameLink.href = location.pathname + '?' + paramsTemp.toString();
  groupnameLink.innerHTML = group.groupname;
  var groupnameTd = document.createElement('td');
  groupnameTd.appendChild(groupnameLink);
  newRow.appendChild(groupnameTd);
  var groupAdminTd = document.createElement('td');
  if (isAdmin(group)) {
    groupAdminTd.innerHTML = "true";
  } else {
    groupAdminTd.innerHTML = "false";
  }
  newRow.appendChild(groupAdminTd);

}

clearTable = function(tableId) {
  var table = document.getElementById(tableId);
  var rowCount = table.rows.length;
  while (--rowCount) table.deleteRow(rowCount);
};

function isAdmin(group) {
  for (var i in group.Users) {
    if (group.Users[i].id == user.getData().id) {
      return group.Users[i].GroupUsers.admin;
    }
  }
  return false;
}

async function loadGroupUsers() {
  var groupname = params.get('groupname')
  console.log('loading group', groupname);
  if (groupname == null) {
    return;
  }
  const groups = await getGroups({ groupname: groupname });
  const users = groups[0].Users;
  clearTable('users-table')
  console.log(users);
  for (var i in users) {
    adduserToTable(users[i]);
  }
}

function adduserToTable(user) {
  console.log('adding user ', user);
  var table = document.getElementById('users-table');
  var newRow = table.insertRow(table.rows.length);
  var usernameTd = document.createElement('td');
  usernameTd.innerHTML = user.username;
  newRow.appendChild(usernameTd);
  var adminTd = document.createElement('td');
  if (user.GroupUsers.admin == true) {
    adminTd.innerHTML = 'true';
  } else {
    adminTd.innerHTML = 'false';
  }
  newRow.appendChild(adminTd);
}

function addUserToGroupButton() {
  const username = document.getElementById('add-user-username').value;
  const admin = document.getElementById('add-user-as-admin').checked;
  addUserToGroup(username, admin);
}

async function addUserToGroup(username, admin) {
  const users = await getUsers({username: username});
  if (users.length != 1) {
    console.log('user not found');
    return;
  }
  const groups = await getGroups({groupname: params.get('groupname')});
  if (groups.length != 1) {
    console.log('group not found');
    return;
  }
  const headers = {}
  if (user.isLoggedIn()) headers.Authorization = user.getJWT();
  const data = {
    groupId: groups[0].id,
    userId: users[0].id,
    admin: admin,
  };
  $.ajax({
    url: groupUsersApiUrl,
    type: 'POST',
    headers: headers,
    data: data,
    success: function(result) {
      console.log(result);
      loadGroupUsers();
    },
    error: function(err) {
      console.log(err.responseJSON);
    },
  });
}

function removeUserFromGroupButton() {
  const username = document.getElementById('remove-user-username').value;
  removeUserFromGroup(username);
}

async function removeUserFromGroup(username) {
  const users = await getUsers({username: username});
  if (users.length != 1) {
    console.log('user not found');
    return;
  }
  const groups = await getGroups({groupname: params.get('groupname')});
  if (groups.length != 1) {
    console.log('group not found');
    return;
  }
  const headers = {}
  if (user.isLoggedIn()) headers.Authorization = user.getJWT();
  const data = {
    groupId: groups[0].id,
    userId: users[0].id,
  };
  $.ajax({
    url: groupUsersApiUrl,
    type: 'DELETE',
    headers: headers,
    data: data,
    success: function(result) {
      console.log(result);
      loadGroupUsers();
    },
    error: function(err) {
      console.log(err.responseJSON);
    },
  });
}

function getGroups(where) {
  const data = { where: JSON.stringify(where) };
  const headers = {};
  if (user.isLoggedIn()) headers.Authorization = user.getJWT();
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: groupsApiUrl,
      type: 'GET',
      headers: headers,
      data: data,
      success: function(result) {
        return resolve(result.groups);
      },
      error: reject,
    })
  });
}

function getUsers(where) {
  const data = {where: JSON.stringify(where) };
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: usersApiUrl,
      type: 'GET',
      data: data,
      success: function (result) {
        return resolve(result.users);
      },
      error: reject,
    })
  });
}
