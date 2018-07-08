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

var count = 54;

window.onload = function() {
  deviceDropdown();

  // Add event listeners for duration slider
  let durationElement = document.getElementById('duration');
  let durationGhostElement = findGhost('duration');
  durationElement.addEventListener('input', updateDurationLabels);
  durationGhostElement.addEventListener('input', updateDurationLabels);

  // Add event listeners for device selection
  let deviceInputElement = document.getElementById('deviceInput');
  deviceInputElement.addEventListener('input', filterDeviceDropdown);

  // Add event listeners for animal selection
  let animalDropdownElement = document.getElementById('animalDropdown');
  let animalItems = animalDropdownElement.children;
  for (let item of animalItems) {
    item.addEventListener('click', (event) => {
      addAnimalToList(event.target.innerText);
    });
  }
  let animalInputElement = document.getElementById('animalInput');
  animalInputElement.addEventListener('input', filterAnimalDropdown);
};

// DEVICE LIST FUNCTIONS

// Returns an array of groups, where each group is an object with name, id, and
// array of devices, where each device has an id and name.
function getGroups() {
  const data = {where: JSON.stringify({}) };
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

// Returns an array of devices, where each devices is an object with name, id,
// and array of users
function getDevices() {
  const data = JSON.stringify({});
  const headers = {};
  if (user.isLoggedIn()) {
    headers.Authorization = user.getJWT();
  }
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: devicesApiUrl,
      type: 'GET',
      headers: headers,
      data: data,
      success: function(result) {
        return resolve(result.devices.rows);
      },
      error: reject,
    });
  });
}

// Populate the device dropdown with devices and groups of devices
async function deviceDropdown() {
  // Extract data from API
  let devices = await getDevices();
  let groups = await getGroups();
  // Add devices to dropdown
  let dropdownMenu = document.getElementsByClassName("dropdown-menu")[0];
  for (let device of devices) {
    let item = document.createElement("div");
    item.innerText = device.devicename;
    item.id = device.id;
    item.classList.add("dropdown-item");
    dropdownMenu.appendChild(item);
  }
  // Add groups to dropdown
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
  let element = document.createElement("div");
  let span = ' <span class="badge badge-secondary" style="cursor: pointer;"><i class="fas fa-times"></i></span>';
  element.innerHTML = device.name + span;
  element.id = device.id;
  element.classList.add("btn");
  element.classList.add("btn-secondary");
  element.classList.add("mr-1");
  element.classList.add("mb-1");
  element.style.cursor = "auto";
  element.setAttribute("role", "button");
  deviceList.appendChild(element);
  // Add event listener for removal
  element = document.getElementById(device.id);
  element.children[0].addEventListener('click', () => {
    removeDeviceFromList(device.id);
  });
  // Change placeholder text and clear input box
  let deviceInput = document.getElementById('deviceInput');
  deviceInput.placeholder = 'add more devices';
  deviceInput.value = "";
  filterDeviceDropdown();
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
function filterDeviceDropdown() {
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

// DURATION SLIDER FUNCTIONS

var durationMax = 100;

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
}

// ANIMAL SELECTOR FUNCTIONS

// Add animal to list of selected animals
function addAnimalToList(animal) {
  let animalList = document.getElementById("animalList");
  // Check whether it is already selected
  for (let listItem of animalList.children) {
    if (listItem.id === animal) {
      // Change placeholder text
      let animalInput = document.getElementById('animalInput');
      animalInput.value = 'add another animal';
      return;
    }
  }
  // Create element and add to animalList
  let element = document.createElement("div");
  let span = ' <span class="badge badge-secondary" style="cursor: pointer;"><i class="fas fa-times"></i></span>';
  element.innerHTML = animal + span;
  element.id = animal;
  element.classList.add("btn");
  element.classList.add("btn-secondary");
  element.classList.add("mr-1");
  element.classList.add("mb-1");
  element.style.cursor = "auto";
  element.setAttribute("role", "button");
  animalList.appendChild(element);
  // Add event listener for removal
  element = document.getElementById(animal);
  element.children[0].addEventListener('click', () => {
    removeAnimalFromList(animal);
  });
  // Change placeholder text and clear input box
  let animalInput = document.getElementById('animalInput');
  animalInput.placeholder = 'add another animal';
  animalInput.value = "";
  filterAnimalDropdown();
}

// Remove animal from list of selected animals
function removeAnimalFromList(animal) {
  let animalList = document.getElementById("animalList");
  for (let listItem of animalList.children) {
    if (listItem.id === animal) {
      animalList.removeChild(listItem);
    }
  }
  // Change placeholder text if no animals left
  if (animalList.children.length === 0) {
    let animalInput = document.getElementById('animalInput');
    animalInput.placeholder = 'all animals';
  }
}

// Filter dropdown to hide animals as you type
function filterAnimalDropdown() {
  let input = document.getElementById("animalInput");
  let filter = input.value.toUpperCase();
  let div = document.getElementById("animalDropdown");
  let items = div.getElementsByTagName("div");
  for (let i = 0; i < items.length; i++) {
    if (items[i].innerHTML.toUpperCase().indexOf(filter) > -1) {
      items[i].style.display = "";
    } else {
      items[i].style.display = "none";
    }
  }
}

// QUERY FUNCTIONS

// Creates a query string
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

  // Add duration condition to query
  let durationText = document.getElementById('durationText').innerText;
  // Check whether the duration slider has moved or whether is still at default
  // values
  if (durationText !== "0 to max sec") {
    let durationLow = document.getElementById('duration').valueLow;
    let durationHigh = document.getElementById('duration').valueHigh;
    query.duration = {
      "$lt": durationHigh,
      "$gt": durationLow
    };
  }

  // Add date conditions to query
  let fromDate = document.getElementById('fromDate').value;
  let toDate = document.getElementById('toDate').value;
  if (fromDate !== "" || toDate !== "") {
    query.recordingDateTime = {};
  }
  if (fromDate !== "") {
    query.recordingDateTime["$gt"] = fromDate;
  }
  if (toDate != "") {
    query.recordingDateTime["$lt"] = toDate;
  }

  console.log("Query: \n", JSON.stringify(query));
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
  // Build query data
  let data = {
    where: query,
    limit: limit,
    offset: offset,
    tagMode: tagMode
  };

  // Get animals
  let animals = [];
  let animalSelected = document.getElementById('animalInput').value;
  if (animalSelected !== "all") {
    let animalList = document.getElementById('animalList');
    for (let animal of animalList.children) {
      animals.push(animal.id);
    }
    data.tags = JSON.stringify(animals);
    console.log("Animals:", data.tags);
  }

  var url = recordingsApiUrl;
  $.ajax({
    url: url,
    type: 'GET',
    data: data,
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

// TABLE FUNCTIONS

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

function parseProcessingState(result) {
  let td = document.createElement("td");
  let string = result.processingState.toLowerCase();
  string = string.charAt(0).toUpperCase() + string.slice(1);
  td.innerHTML = string;
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
  {
    tableName: "Processing State",
    datapointField: "datapoint",
    parseFunction: parseProcessingState
  },
  ];
}
