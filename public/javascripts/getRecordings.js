/*
The server uses Sequelize as an ORM to perform queries.
The server will set "where" equal to the given query, will be slightly modified
for security, so it should follow the format given from Sequelize.
http://docs.sequelizejs.com/manual/tutorial/querying.html#where
*/

/* global api, user, Map, Promise */

/* exported changeDurationSliderMax, inc, dec */

var recordingsApiUrl = api + '/api/v1/recordings';
var devicesApiUrl = api + '/api/v1/devices';
var viewUrl = '/view_recording/';
const groupsApiUrl = api + '/api/v1/groups';

const conditions = {};
var nextId = 1;
var count = 54;

window.onload = function() {
  var headers = {};
  if (user.isLoggedIn()) {
    headers.Authorization = user.getJWT();
  }
  $.ajax({
    url: devicesApiUrl,
    type: 'GET',
    headers: headers,
    success: function(result) {
      deviceDropdown(result.devices.rows);
    },
    error: function(err) {
      console.log(err);
    }
  });

  // Add event listeners for duration slider
  let durationElement = document.getElementById('duration');
  let durationGhostElement = findGhost('duration');
  durationElement.addEventListener('change', addDurationFromSlider);
  durationGhostElement.addEventListener('change', addDurationFromSlider);
  durationElement.addEventListener('input', updateDurationLabels);
  durationGhostElement.addEventListener('input', updateDurationLabels);

  // Add event listeners for date selection
  let fromDateElement = document.getElementById('fromDate');
  let toDateElement = document.getElementById('toDate');
  fromDateElement.addEventListener('input', addFromDate);
  toDateElement.addEventListener('input', addToDate);

  // Add event listeners for device selection
  let deviceInputElement = document.getElementById('deviceInput');
  deviceInputElement.addEventListener('input', filterDropdown);
};

// DEVICE LIST FUNCTIONS

// Populate list with devices
async function deviceDropdown(devices) {
  // Add devices
  let dropdownMenu = document.getElementsByClassName("dropdown-menu")[0];
  for (let device of devices) {
    let item = document.createElement("div");
    item.innerText = device.devicename;
    item.id = device.id;
    item.classList.add("dropdown-item");
    dropdownMenu.appendChild(item);
  }
  // Add groups
  let groups = await getGroups({});
  for (let group of groups) {
    let item = document.createElement("div");
    item.innerText = group.name + " (group)";
    item.id = group.devices;
    item.classList.add("dropdown-item");
    dropdownMenu.appendChild(item);
  }
  // Add event listeners
  for (let item of dropdownMenu.children) {
    item.addEventListener("click", (event) => {
      let device = {
        id: event.target.id,
        name: event.target.innerText
      };
      addDeviceToList(device);
    });
  }
}

// Add device to list of selected devices
function addDeviceToList(device) {
  let deviceList = document.getElementById("deviceList");
  // Check whether it is already selected
  for (let listItem of deviceList.children) {
    if (listItem.innerText === device.name + ' ') {
      return;
    }
  }
  // Create element and add to deviceList
  let element = document.createElement("button");
  let span = ' <span class="badge badge-secondary" style="cursor: pointer;"><i class="fas fa-times"></i></span>';
  element.innerHTML = device.name + span;
  element.id = device.id;
  element.classList.add("btn");
  element.style.cursor = "auto";
  deviceList.appendChild(element);
  // Add event listener for removal
  element = document.getElementById(device.id);
  element.children[0].addEventListener('click', () => {
    removeDeviceFromList(device.id);
  });
  // Change placeholder text
  let deviceInput = document.getElementById('deviceInput');
  deviceInput.placeholder = 'add more devices';
}

// Remove device from list of selected devices
function removeDeviceFromList(deviceId) {
  let deviceList = document.getElementById("deviceList");
  for (let listItem of deviceList.children) {
    if (listItem.id === deviceId) {
      deviceList.removeChild(listItem);
    }
  }
  // Change placeholder text if no devices left
  if (deviceList.children.length === 0) {
    let deviceInput = document.getElementById('deviceInput');
    deviceInput.placeholder = 'all devices';
  }
}

// Filter dropdown to hide devices as you type
function filterDropdown() {
  let input = document.getElementById("deviceInput");
  let filter = input.value.toUpperCase();
  let div = document.getElementsByClassName("dropdown-menu")[0];
  let items = div.getElementsByTagName("div");
  for (let i = 0; i < items.length; i++) {
    if (items[i].innerHTML.toUpperCase().indexOf(filter) > -1) {
      items[i].style.display = "";
    } else {
      items[i].style.display = "none";
    }
  }
}

// Returns an array of groups, where each group is an object with name, id, and
// array of devices, where each device has an id and name.
function getGroups(where) {
  const data = { where: JSON.stringify(where) };
  const headers = {};
  if (user.isLoggedIn()) {
    headers.Authorization = user.getJWT();
  }
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: groupsApiUrl,
      type: 'GET',
      headers: headers,
      data: data,
      success: function(result) {
        let groups = [];
        // Extract device IDs
        for (let item of result.groups) {
          let deviceIds = [];
          for (let device of item.Devices) {
            deviceIds.push(device.id);
          }
          // Create group object
          let group = {
            name: item.groupname,
            id: item.id,
            devices: deviceIds
          };
          groups.push(group);
        }
        return resolve(groups);
      },
      error: reject,
    });
  });
}

//===============ADD CONDITIONS==================
// Adds a Sequelize condition.
function addCondition(sequelizeCondition) {
  var id = nextId++;
  conditions[id] = sequelizeCondition;
}

// Removes a Sequelize condition with the given ID.
function deleteCondition(id) {
  delete conditions[id];
}

function addToDate() {
  // Remove any existing toDate conditions
  for (let i in conditions) {
    if (conditions[i].recordingDateTime !== undefined) {
      if (conditions[i].recordingDateTime.$lt !== undefined) {
        deleteCondition(i);
      }
    }
  }
  // Add new condition
  var date = document.getElementById('toDate').value;
  if (date != "") {
    addCondition({ recordingDateTime: { "$lt": date} });
  }
}

function addFromDate() {
  // Remove any existing fromDate conditions
  for (let i in conditions) {
    if (conditions[i].recordingDateTime !== undefined) {
      if (conditions[i].recordingDateTime.$gt !== undefined) {
        deleteCondition(i);
      }
    }
  }
  // Add new condition
  var date = document.getElementById('fromDate').value;
  if (date != "") {
    addCondition({ recordingDateTime: { "$gt": date } });
  }
}

var durationMax = 100;

function addDurationFromSlider() {
  // Remove any existing duration conditions
  for (let i in conditions) {
    if (conditions[i].duration !== undefined) {
      deleteCondition(i);
    }
  }

  let durationElement = document.getElementById('duration');
  let durationHigh = durationElement.valueHigh;
  let durationLow = durationElement.valueLow;

  // Add new duration conditions
  addCondition({ duration: { "$lt": durationHigh } });
  addCondition({ duration: { "$gt": durationLow } });

  updateDurationLabels();
}

function updateDurationLabels() {
  let durationGhostElement = findGhost('duration');
  let durationElement = document.getElementById('duration');
  let durationHigh = durationElement.valueHigh;
  let durationLow = durationElement.valueLow;
  let durationMax = durationElement.max;
  // Update display underneath slider
  document.getElementById('durationLow').innerHTML = durationLow;
  document.getElementById('durationHigh').innerHTML = durationHigh;
  // Update coloured slider
  durationGhostElement.style.setProperty("--low", 100 * durationLow / durationMax + 1 + "%");
  durationGhostElement.style.setProperty("--high", 100 * durationHigh / durationMax - 1 + "%");
  // Update max value
  document.getElementById('durationMax').innerHTML = durationMax;
  document.getElementById('durationMaxChange').style.display = 'inline';
}

function findGhost(id) {
  // Find only the ghost element with given id
  let allGhosts = document.querySelectorAll('.ghost');
  for (let item of allGhosts) {
    if (item.id === id) {
      return item;
    }
  }
}

function changeDurationSliderMax() {
  let durationElement = document.getElementById('duration');
  let durationGhostElement = findGhost('duration');
  let durationMaxChangeElement = document.getElementById('durationMaxChange');

  let maxDurationMax = 600;
  if (durationMax < maxDurationMax) {
    durationMax += 100;
  } else {
    durationMax = 100;
    // Change undo back to arrows
    durationMaxChangeElement.classList.remove('fa-undo');
    durationMaxChangeElement.classList.add('fa-angle-double-right');
  }
  if (durationMax === maxDurationMax) {
    // Change arrows >> to undo
    durationMaxChangeElement.classList.remove('fa-angle-double-right');
    durationMaxChangeElement.classList.add('fa-undo');
  }
  durationElement.max = durationMax;
  durationGhostElement.max = durationMax;
  durationGhostElement.style.setProperty("--low", 100 * durationElement.valueLow / durationMax + 1 + "%");
  durationGhostElement.style.setProperty("--high", 100 * durationElement.valueHigh / durationMax - 1 + "%");
  addDurationFromSlider();
}

// Increase query offset, view next set of results.
function inc() {
  var offset = document.getElementById('offset');
  var offsetN = Number(offset.value);
  var limitN = Number(document.getElementById('limit').value);
  if (offsetN + limitN < count) {
    offset.value = offsetN + limitN;
  }
  sendQuery();
}

// Decrease query offset, vew previous set of results.
function dec() {
  var offset = document.getElementById('offset');
  var offsetN = Number(offset.value);
  var limitN = Number(document.getElementById('limit').value);
  var newOffsetVal = offsetN - limitN;
  if (newOffsetVal <= 0) {
    newOffsetVal = 0;
  }
  offset.value = newOffsetVal;
  sendQuery();
}

// Creates a query string (replaces active query HTML field)
function buildQuery() {
  let query = {type: 'thermalRaw'};

  // Add device id to query
  let deviceList = document.getElementById('deviceList');
  if (deviceList.children.length !== 0) {
    query.DeviceId = [];
    for (let device of deviceList.children) {
      if (device.innerText.slice(-8) === "(group) ") {
        // Add IDs for groups separately
        let devices = device.id.split(',');
        for (let id of devices) {
          query.DeviceId.push(id);
        }
      } else {
        query.DeviceId.push(device.id);
      }
    }
  }

  // Add conditions to query
  for (var i in conditions) {
    var condition = conditions[i];
    // Two examples that condition could be:
    // {duration: {$lt: 10}} Duration should be less than 4.
    // {duration: 2}        Duration should be equal to 2.
    for (var key in condition) {
      // Adding empty object if one is not already defined for that key.
      if (query[key] === undefined) {
        query[key] = {};
      }

      // If condition is an object append each condition. {duration: {$lt: 4}}
      // Just one condition in this case.
      // query.duration.$lt = 4;
      if (typeof condition[key] === 'object') {
        for (var j in condition[key]) {
          query[key][j] = condition[key][j];
        }
      } else {
        // If not a object just set key to that value. {duration: 2}
        // query.duration = 2;
        query[key] = condition[key];
      }
    }
  }
  console.log("Query: \n", query);
  return JSON.stringify(query);
}

// Sends a query and updates the table with the new results.
function sendQuery() {
  let query = buildQuery();
  clearTable();

  // Get query params.
  var limit = Number(document.getElementById('limit').value);
  var offset = Number(document.getElementById('offset').value);
  var tagMode = $('select#tagMode').val();

  var url = recordingsApiUrl;
  $.ajax({
    url: url,
    type: 'GET',
    data: {
      where: query,
      limit: limit,
      offset: offset,
      tagMode: tagMode,
    },
    headers: { Authorization: user.getJWT() },
    success: function(res) {
      console.log('Successful request:', res);
      if (res.count === 0) {
        window.alert('No results for query.');
      }
      for (var i in res.rows) {
        appendDatapointToTable(res.rows[i]);
      }
      limit = res.limit;
      count = res.count; // number of results from query.
      document.getElementById('offset').value = res.offset;
      document.getElementById('limit').value = res.limit;
      document.getElementById('count').innerHTML = count + " matches found (total)";
    },
    error: function(err) {
      window.alert('Error with query.');
      console.log('Error:', err);
    },
  });
}

// Clears the results table.
function clearTable() {
  var table = document.getElementById('results-table');
  var rowCount = table.rows.length;
  while (--rowCount) {
    table.deleteRow(rowCount);
  }
}

// Parses throug a Datapoint and adds it to the result table.
function appendDatapointToTable(datapoint) {
  var table = document.getElementById('results-table');
  var newRow = table.insertRow(table.rows.length);
  var tableData = getTableData();
  newRow.appendChild(datapointViewElement(datapoint));
  // Itterate through tableData appending elements onto the new row for each
  // field in tableData. tableData describes what the columns should look like.
  for (var i in tableData) {
    // Some columns need the whole datapoint to parse not just one element.
    var value;
    if (tableData[i].datapointField == 'datapoint') {
      // parsing the whole datapoint.
      value = datapoint;
    } else {
      // parsing just one element
      value = datapoint[tableData[i].datapointField];
    }
    newRow.appendChild(tableData[i].parseFunction(value));
  }
}

// Returns an element that links to a page to view the recording.
function datapointViewElement(datapoint) {
  var link = document.createElement("a");
  link.setAttribute('href', viewUrl + datapoint.id);
  link.setAttribute('target', '_blank');
  link.innerHTML = 'View';
  var td = document.createElement("td");
  td.appendChild(link);
  return td;
}

function parseNumber(number) {
  var td = document.createElement("td");
  td.innerHTML = number;
  return td;
}

function parseLocation(location) {
  var td = document.createElement("td");
  if (location && typeof location === 'object') {
    var latitude = location.coordinates[0];
    var longitude = location.coordinates[1];
    td.innerHTML = latitude + ', ' + longitude;
    return td;
  }
  td.innerHTML = '<span class="text-muted">(unknown)</span>';
  return td;
}

function parseDuration(duration) {
  var td = document.createElement("td");
  td.innerHTML = duration;
  return td;
}

function parseTime(dateTime) {
  var td = document.createElement("td");
  if (dateTime == null) {
    return td;
  }
  var d = new Date(dateTime);
  td.innerHTML = d.toLocaleTimeString();
  return td;
}

function parseDate(dateTime) {
  var td = document.createElement("td");
  if (dateTime == null) {
    return td;
  }
  var d = new Date(dateTime);
  td.innerHTML = d.toLocaleDateString('en-NZ');
  return td;
}

function parseTags(tags) {
  // Group tags by animal type
  var tagMap = new Map();
  for (var i = 0; i < tags.length; i++) {
    var tag = tags[i];
    var animal = tag.animal;
    if (animal == null) {
      animal = 'F/P';
    }

    var tagTypes = tagMap.get(animal);
    if (tagTypes === undefined) {
      tagTypes = {
        human: false,
        automatic: false,
      };
    }
    if (tag.automatic) {
      tagTypes.automatic = true;
    } else {
      tagTypes.human = true;
    }

    tagMap.set(animal, tagTypes);
  }

  // Generate HTML for each tag (different colour according to tag
  // types seen).
  var items = [];
  for (const kv of tagMap.entries()) {
    animal = kv[0];
    var types = kv[1];
    if (types.human && types.automatic) {
      items.push('<span class="text-success">' + animal + '</span>');
    } else if (types.automatic) {
      items.push('<span class="text-danger">' + animal + '</span>');
    } else {
      items.push(animal);
    }
  }

  var td = document.createElement("td");
  td.innerHTML = items.join(' ');
  return td;
}

function parseOther() {
  // Airplane and battery status can go here.
  var td = document.createElement("td");
  td.innerHTML = '<span class="text-muted">-</span>';
  return td;
}


// Generates a Download button to download the recording
function parseDownload(id, type) {
  var td = document.createElement("td");
  var button = document.createElement("button");
  button.innerHTML = "Download";

  button.onclick = function() {
    // Get server to generate a JWT for downloading the file.
    var headers = {};
    if (user.isLoggedIn()) {
      headers.Authorization = user.getJWT();
    }
    var url = recordingsApiUrl + '/' + id;
    $.ajax({
      url: url,
      type: 'GET',
      headers: headers,
      success: function(res) {
        var url = api + "/api/v1/signedUrl?jwt=" + res[type];
        var linkElement = document.createElement('a');
        linkElement.href = url;
        var click = document.createEvent('MouseEvents');
        click.initEvent('click', true, true);
        linkElement.dispatchEvent(click);
      },
      error: console.log,
    });
  };
  td.appendChild(button);
  return td;
}

function parseDownloadRaw(id) {
  return parseDownload(id, 'downloadRawJWT');
}

function parseDownloadFile(id) {
  return parseDownload(id, 'downloadFileJWT');
}

function parseGroup(group) {
  var td = document.createElement("td");
  td.innerHTML = group.groupname;
  return td;
}

function parseDevice(device) {
  var td = document.createElement("td");
  td.innerHTML = device.devicename;
  return td;
}

function getTableData() {
  return [{
    tableName: "ID",
    datapointField: "id",
    parseFunction: parseNumber
  },
  {
    tableName: "Device",
    datapointField: "Device",
    parseFunction: parseDevice
  },
  {
    tableName: "Group",
    datapointField: "Group",
    parseFunction: parseGroup
  },
  {
    tableName: "Location",
    datapointField: "location",
    parseFunction: parseLocation
  },
  {
    tableName: "Time",
    datapointField: "recordingDateTime",
    parseFunction: parseTime
  },
  {
    tableName: "Date",
    datapointField: "recordingDateTime",
    parseFunction: parseDate
  },
  {
    tableName: "Duration",
    datapointField: "duration",
    parseFunction: parseDuration
  },
  {
    tableName: "Tags",
    datapointField: "Tags",
    parseFunction: parseTags,
  },
  {
    tableName: "Other",
    datapointField: "datapoint",
    parseFunction: parseOther,
  },
  {
    tableName: "File",
    datapointField: "id",
    parseFunction: parseDownloadFile
  },
  {
    tableName: "File",
    datapointField: "id",
    parseFunction: parseDownloadRaw
  },
  ];
}
