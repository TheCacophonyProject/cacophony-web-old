/*
The server uses Sequelize as an ORM to perform queries.
The server will set "where" equal to the given query, will be slightly modified
for security, so it should follow the format given from Sequelize.
http://docs.sequelizejs.com/manual/tutorial/querying.html#where
*/

/* global api, user, Map */

/* exported deleteCondition, addBeforeDate, addAfterDate,
 * addLongerThan, addShorterThan, fromConditions, inc, dec, getAll,
 * addDurationFromSlider, changeMaxDuration */

var recordingsApiUrl = api + '/api/v1/recordings';
var devicesApiUrl = api + '/api/v1/devices';
var viewUrl = '/view_recording/';

const conditions = {};
var nextId = 1;
var count = 54;

window.onload = function() {
  var headers = {};
  if (user.isLoggedIn()) {headers.Authorization = user.getJWT();}
  $.ajax({
    url: devicesApiUrl,
    type: 'GET',
    headers: headers,
    success: function(result) {
      var deviceSelect = document.getElementById("deviceSelect");
      for (var i in result.devices.rows) {
        var device = result.devices.rows[i];
        var option = document.createElement("option");
        option.innerText = device.devicename;
        option.id = device.id;
        deviceSelect.appendChild(option);
      }
    },
    error: function(err) {
      console.log(err);
    }
  });

  let durationElement = document.getElementById('duration');
  // Find only the ghost element with id duration
  // (just in case there is another multirange slider on the page)
  let allGhosts = document.querySelectorAll('.ghost');
  let durationGhostElement = '';
  for (let item of allGhosts) {
    if (item.id === 'duration') {
      durationGhostElement = item;
    }
  }
  durationElement.addEventListener('input', addDurationFromSlider);
  durationGhostElement.addEventListener('input', addDurationFromSlider);

};

// Adds a Sequelize condition to the query.
function addCondition(sequelizeCondition) {
  // console.log('Add condition:', sequelizeCondition);
  var id = nextId++;
  conditions[id] = sequelizeCondition;
  updateConditions();
}

// Removes a Sequelize condition with the given ID.
function deleteCondition(id) {
  // console.log('Delete condition: ', id);
  delete conditions[id];
  updateConditions();
}

// Removes the display of the previous query and displays the new one.
function updateConditions() {
  // console.log('Update conditions');
  // Delete display of old query.
  var conditionsElement = document.getElementById('conditions');
  conditionsElement.innerHTML = '';

  // Iterates through each condition displaying it along with a delete button.
  for (var i in conditions) {
    var l = document.createElement('label');
    var deleteButton = document.createElement('input');
    deleteButton.setAttribute('type', 'button');
    deleteButton.value = 'Delete';
    deleteButton.setAttribute('onclick', 'deleteCondition(' + i + ')');
    var br = document.createElement('br');
    l.innerHTML = JSON.stringify(conditions[i]);
    conditionsElement.appendChild(l);
    conditionsElement.appendChild(deleteButton);
    conditionsElement.appendChild(br);
  }
}

// Makes a Sequelize query from the user defined conditions.
function fromConditions() {
  var query = {type: 'thermalRaw'};
  for (var i in conditions) {
    var condition = conditions[i];
    // Two examples that condition could be:
    // {duration: {$lt: 10}} Duration should be less than 4.
    // {duration: 2}        Duration should be equal to 2.
    for (var key in condition) {
      // Adding empty object if one is not already defined for that key.
      if (query[key] === undefined) {query[key] = {};}

      // If condition is an object append each condition. {duration: {$lt: 4}}
      // Just one condition in this case.
      // query.duration.$lt = 4;
      if (typeof condition[key] === 'object')
      {for (var j in condition[key]) {query[key][j] = condition[key][j];}}

      // If not a object just set key to that value. {duration: 2}
      // query.duration = 2;
      else
      {query[key] = condition[key];}
    }
  }

  document.getElementById('active-query').value = JSON.stringify(query);
  sendQuery();
}

//===============ADD CONDITIONS==================
function addBeforeDate() {
  var date = document.getElementById('before-date').value;
  addCondition({ recordingDateTime: { "$lt": date} });
}

function addAfterDate() {
  var date = document.getElementById('after-date').value;
  addCondition({ recordingDateTime: { "$gt": date } });
}

function addLongerThan() {
  var duration = document.getElementById('longer-than').value;
  addCondition({ duration: { "$gt": duration } });
}

function addShorterThan() {
  var duration = document.getElementById('shorter-than').value;
  addCondition({ duration: { "$lt": duration } });
}

var durationScale = 1;



function addDurationFromSlider() {
  // Remove any existing duration conditions
  for (let i in conditions) {
    if (conditions[i].duration !== undefined) {
      deleteCondition(i);
    }
  }

  let durationElement = document.getElementById('duration');
  // Add new duration conditions - scale as per durationScale factor
  let durationHigh = durationElement.valueHigh * durationScale;
  addCondition({ duration: { "$lt": durationHigh } });
  let durationLow = durationElement.valueLow * durationScale;
  addCondition({ duration: { "$gt": durationLow } });

  // Update display underneath slider
  document.getElementById('durationLow').innerHTML = durationLow;
  document.getElementById('durationHigh').innerHTML = durationHigh;
}


function changeMaxDuration() {
  // Adjust slider to new position
  let durationElement = document.getElementById('duration');
  // Find only the ghost element with id duration
  // (just in case there is another multirange slider on the page)
  let allGhosts = document.querySelectorAll('.ghost');
  let durationGhostElement = '';
  for (let item of allGhosts) {
    if (item.id === 'duration') {
      durationGhostElement = item;
    }
  }
  let durationLow = durationElement.valueLow;
  let durationHigh = durationElement.valueHigh;

  let maxScale = 6;
  if (durationScale < maxScale) {
    durationLow = durationLow * durationScale / (durationScale + 1);
    durationHigh = durationHigh * durationScale / (durationScale + 1);
    durationScale ++;
  } else {
    durationLow = durationLow * durationScale;
    if (durationHigh * durationScale >= 100) {
      durationHigh = 100;
    } else {
      durationHigh = durationHigh * durationScale;
    }
    durationScale = 1;
  }
  durationElement.valueLow = durationLow;
  durationElement.valueHigh = durationHigh;
  durationGhostElement.style.setProperty("--low", durationLow + 1 + "%");
  durationGhostElement.style.setProperty("--high", durationHigh - 1 + "%");


  addDurationFromSlider();
}

// Increase query offset, view next set of results.
function inc() {
  var offset = document.getElementById('offset');
  var offsetN = Number(offset.value);
  var limitN = Number(document.getElementById('limit').value);
  if (offsetN + limitN < count)
  {offset.value = offsetN + limitN;}
  sendQuery();
}

// Decrease query offset, vew previous set of results.
function dec() {
  var offset = document.getElementById('offset');
  var offsetN = Number(offset.value);
  var limitN = Number(document.getElementById('limit').value);
  var newOffsetVal = offsetN - limitN;
  if (newOffsetVal <= 0)
  {newOffsetVal = 0;}
  offset.value = newOffsetVal;
  sendQuery();
}

// Get all results available
function getAll() {
  var query = {};

  var deviceId = document.getElementById("deviceSelect").selectedOptions[0].id;
  if (deviceId != "") {query.DeviceId = deviceId;}

  document.getElementById('active-query').value = JSON.stringify(query);
  sendQuery();
}

// Send the active query. Takes the query in the 'active-query' element and
// updates the table with the new results.
function sendQuery() {
  clearTable();

  // Get query params.
  var query = document.getElementById('active-query').value;
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
      if (res.count === 0)
      {window.alert('No results for query.');}
      for (var i in res.rows)
      {appendDatapointToTable(res.rows[i]);}
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
  if (dateTime == null)
  {return td;}
  var d = new Date(dateTime);
  td.innerHTML = d.toLocaleTimeString();
  return td;
}

function parseDate(dateTime) {
  var td = document.createElement("td");
  if (dateTime == null)
  {return td;}
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
    if (user.isLoggedIn()) {headers.Authorization = user.getJWT();}
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
