const devicesApiUrl = api + '/api/v1/devices';
const usersApiUrl = api + '/api/v1/users';
const deviceUsersApiUrl = api + '/api/v1/devices/users';
const params = new URLSearchParams(location.search);
var devices = [];
var activeDevice = null;

window.onload = async function() {
  updateDeviceTitle();
  await loadDevices();
  updateActiveDevice();
  loadDeviceUsers();
}

function updateActiveDevice() {
  activeDevice = null;
  const devicename = params.get('devicename');
  for (var i in devices) {
    if (devices[i].devicename == devicename) {
      activeDevice = devices[i];
    }
  }
}

function updateDeviceTitle() {
  const title = document.getElementById('device-title');
  const devicename = params.get('devicename');
  if (devicename == null) {
    title.innerHTML = 'Devices'
  } else {
    title.innerHTML = 'Device ' + devicename;
  }
}

async function loadDevices() {
  await getDevices();
  clearTable('devices-table');
  for (var i in devices) {
    addDeviceToTable(devices[i]);
  }
}

function addDeviceToTable(device) {
  var table = document.getElementById('devices-table');
  var newRow = table.insertRow(table.rows.length);
  var deviceIdTd = document.createElement('td');
  deviceIdTd.innerHTML = device.id;
  newRow.appendChild(deviceIdTd);
  var devicenameLink = document.createElement('a');
  const paramsTemp = new URLSearchParams(location.search);
  paramsTemp.set('devicename', device.devicename);
  devicenameLink.href = location.pathname + '?' + paramsTemp.toString();
  devicenameLink.innerHTML = device.devicename;
  var devicenameTd = document.createElement('td');
  devicenameTd.appendChild(devicenameLink);
  newRow.appendChild(devicenameTd);
  var deviceAdminTd = document.createElement('td');
  deviceAdminTd.innerHTML = isAdmin(device) ? "true" : "false";
  newRow.appendChild(deviceAdminTd);

}

function clearTable(tableId) {
  var table = document.getElementById(tableId);
  var rowCount = table.rows.length;
  while (--rowCount) table.deleteRow(rowCount);
};

function isAdmin(device) {
  for (var i in device.Users) {
    if (device.Users[i].id == user.getData().id) {
      return device.Users[i].DeviceUsers.admin;
    }
  }
  return false;
}

async function loadDeviceUsers() {
  var devicename = params.get('devicename')
  if (devicename == null) {
    return;
  }
  const users = activeDevice.Users;
  clearTable('users-table');
  for (var i in users) {
    adduserToTable(users[i]);
  }
}

function adduserToTable(user) {
  var table = document.getElementById('users-table');
  var newRow = table.insertRow(table.rows.length);
  var usernameTd = document.createElement('td');
  usernameTd.innerHTML = user.username;
  newRow.appendChild(usernameTd);
  var adminTd = document.createElement('td');
  if (user.DeviceUsers.admin == true) {
    adminTd.innerHTML = 'true';
  } else {
    adminTd.innerHTML = 'false';
  }
  newRow.appendChild(adminTd);
}

function addUserToDeviceButton() {
  const username = document.getElementById('add-user-username').value;
  const admin = document.getElementById('add-user-as-admin').checked;
  addUserToDevice(username, admin);
}

async function addUserToDevice(username, admin) {
  const users = await getUsers({username: username});
  if (users.length != 1) {
    return;
  }

  const headers = {}
  if (user.isLoggedIn()) headers.Authorization = user.getJWT();
  const data = {
    deviceId: activeDevice.id,
    userId: users[0].id,
    admin: admin,
  };
  $.ajax({
    url: deviceUsersApiUrl,
    type: 'POST',
    headers: headers,
    data: data,
    success: update,
    error: function(err) {
      console.log(err.responseJSON);
    },
  });
}

function removeUserFromDeviceButton() {
  const username = document.getElementById('remove-user-username').value;
  removeUserFromDevice(username);
}

async function removeUserFromDevice(username) {
  const users = await getUsers({username: username});
  if (users.length != 1) {
    return;
  }
  const headers = {}
  if (user.isLoggedIn()) headers.Authorization = user.getJWT();
  const data = {
    deviceId: activeDevice.id,
    userId: users[0].id,
  };
  $.ajax({
    url: deviceUsersApiUrl,
    type: 'DELETE',
    headers: headers,
    data: data,
    success: update,
    error: function(err) {
      console.log(err.responseJSON);
    },
  });
}

function update() {
  updateDeviceTitle();
  loadDevices()
    .then(() => {
      updateActiveDevice();
      loadDeviceUsers();
    });
}

function getDevices() {
  const headers = {};
  if (user.isLoggedIn()) headers.Authorization = user.getJWT();
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: devicesApiUrl,
      type: 'GET',
      headers: headers,
      success: function(result) {
        devices = result.devices.rows;
        return resolve();
      },
      error: reject,
    })
  });
}

function getUsers(where) {
  const data = {where: JSON.stringify(where) };
  return new Promise(function(resolve, reject) {
    const headers = {};
    if (user.isLoggedIn()) headers.Authorization = user.getJWT();
    $.ajax({
      url: usersApiUrl,
      type: 'GET',
      data: data,
      headers: headers,
      success: function (result) {
        return resolve(result.users);
      },
      error: reject,
    })
  });
}
