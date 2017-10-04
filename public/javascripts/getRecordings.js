/*
The server uses Sequelize as an ORM to perform queries.
The server will set "where" equal to the given query, will be slightly modified
for security, so it should follow the format given from Sequelize.
http://docs.sequelizejs.com/manual/tutorial/querying.html#where
*/

var recordingsApiUrl = api + '/api/v1/recordings';
var viewUrl = '/view_recording/';

queryUtil = {};

conditions = {};
nextId = 1;
count = 54;

// Adds a Sequelize condition to the query.
addCondition = function(sequelizeCondition) {
  console.log('Add condition:', sequelizeCondition);
  var id = nextId++;
  conditions[id] = sequelizeCondition;
  updateConditions();
};

// Removes a Sequelize condition with the given ID.
deleteCondition = function(id) {
  console.log('Delete condition: ', id);
  delete conditions[id];
  updateConditions();
};

// Removes the display of the previous query and displays the new one.
updateConditions = function() {
  console.log('Update conditions');
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
};

// Makes a Sequelize query from the user defined conditions.
fromConditions = function() {
  var query = {type: 'thermalRaw'};
  for (var i in conditions) {
    var condition = conditions[i];
    // Two examples that condition could be:
    // {duration: {$lt: 10}} Duration should be less than 4.
    // {duration: 2}        Duration should be equal to 2.
    for (var key in condition) {
      // Adding empty object if one is not already defined for that key.
      if (query[key] === undefined) query[key] = {};

      // If condition is an object append each condition. {duration: {$lt: 4}}
      // Just one condition in this case.
      // query.duration.$lt = 4;
      if (typeof condition[key] === 'object')
        for (var j in condition[key]) query[key][j] = condition[key][j];

      // If not a object just set key to that value. {duration: 2}
      // query.duration = 2;
      else
        query[key] = condition[key];
    }
  }

  document.getElementById('active-query').value = JSON.stringify(query);
  sendQuery();
};

//===============ADD CONDITIONS==================
addBeforeDate = function() {
  var date = document.getElementById('before-date').value;
  addCondition({ recordingDateTime: { "$lt": date} });
};

addAfterDate = function() {
  var date = document.getElementById('after-date').value;
  addCondition({ recordingDateTime: { "$gt": date } });
};

addLongerThan = function() {
  var duration = document.getElementById('longer-than').value;
  addCondition({ duration: { "$gt": duration } });
};

addShorterThan = function() {
  var duration = document.getElementById('shorter-than').value;
  addCondition({ duration: { "$lt": duration } });
};

addDeviceId = function() {
  var id = Number(document.getElementById('device-id').value);
  addCondition({ DeviceId: id });
};

// Increase query offset, view next set of results.
inc = function() {
  var offset = document.getElementById('offset');
  var offsetN = Number(offset.value);
  var limitN = Number(document.getElementById('limit').value);
  if (offsetN + limitN < count)
    offset.value = offsetN + limitN;
  sendQuery();
};

// Decrease query offset, vew previous set of results.
dec = function() {
  var offset = document.getElementById('offset');
  var offsetN = Number(offset.value);
  var limitN = Number(document.getElementById('limit').value);
  var newOffsetVal = offsetN - limitN;
  if (newOffsetVal <= 0)
    newOffsetVal = 0;
  offset.value = newOffsetVal;
  sendQuery();
};

// Get all results available
getAll = function() {
  document.getElementById('active-query').value = '{}';
  sendQuery();
};

// Send the active query. Takes the query in the 'active-query' element and
// updates the table with the new results.
sendQuery = function() {
  clearTable();

  // Get query params.
  var query = document.getElementById('active-query').value;
  var limit = Number(document.getElementById('limit').value);
  var offset = Number(document.getElementById('offset').value);

  var url = recordingsApiUrl
  $.ajax({
    url: url,
    type: 'GET',
    data: {
      where: query,
      limit: limit,
      offset: offset,
    },
    headers: { Authorization: user.getJWT() },
    success: function(res) {
      console.log('Successful request:', res);
      if (res.count === 0)
        window.alert('No results for query.');
      for (var i in res.rows)
        appendDatapointToTable(res.rows[i]);
      document.getElementById('offset').value = res.offset;
      document.getElementById('limit').value = res.limit;
      count = res.count; // number of results from query.
      document.getElementById('count').innerHTML = count +
        ' results.';
    },
    error: function(err) {
      window.alert('Error with query.');
      console.log('Error:', err);
    },
  });
};

// Clears the results table.
clearTable = function() {
  var table = document.getElementById('results-table');
  var rowCount = table.rows.length;
  while (--rowCount) table.deleteRow(rowCount);
};

// Parses throug a Datapoint and adds it to the result table.
appendDatapointToTable = function(datapoint) {
  var table = document.getElementById('results-table');
  var newRow = table.insertRow(table.rows.length);
  var tableData = getTableData();
  newRow.appendChild(datapointViewElement(datapoint));
  // Itterate through tableData appending elements onto the new row for each
  // field in tableData. tableData describes what the columns should look like.
  for (var i in tableData) {
    // Some columns need the whole datapoint to parse not just one element.
    if (tableData[i].datapointField == 'datapoint')
      var value = datapoint; // parsing the whole datapoint.
    else
      var value = datapoint[tableData[i].datapointField]; // parsing just one element
    newRow.appendChild(tableData[i].parseFunction(value));
  }
};

// Returns an element that links to a page to view the recording.
datapointViewElement = function(datapoint) {
  var link = document.createElement("a");
  link.setAttribute('href', viewUrl + datapoint.id);
  link.setAttribute('target', '_blank');
  link.innerHTML = 'View';
  var td = document.createElement("td");
  td.appendChild(link);
  return td;
};

parseNumber = function(number) {
  var td = document.createElement("td");
  td.innerHTML = number;
  return td;
};

parseLocation = function(location) {
  var td = document.createElement("td");
  if (location && typeof location === 'object') {
    var latitude = location.coordinates[0];
    var longitude = location.coordinates[1];
    td.innerHTML = latitude + ', ' + longitude;
    return td;
  }
  td.innerHTML = 'No location.';
  return td;
};

parseDuration = function(duration) {
  var td = document.createElement("td");
  td.innerHTML = duration;
  return td;
};

parseTime = function(dateTime) {
  var td = document.createElement("td");
  if (dateTime == null)
    return td;
  var d = new Date(dateTime);
  td.innerHTML = d.toLocaleTimeString();
  return td;
};

parseDate = function(dateTime) {
  var td = document.createElement("td");
  if (dateTime == null)
    return td;
  var d = new Date(dateTime);
  td.innerHTML = d.toLocaleDateString();
  return td;
};

// Generates a Download button to download the recording
parseDownload = function(id) {
  var td = document.createElement("td");
  var button = document.createElement("button");
  button.innerHTML = "Download";

  button.onclick = function() {
    // Get server to generate a JWT for downloading the file.
    var headers = {};
    if (user.isLoggedIn()) headers.Authorization = user.getJWT();
    var url = recordingsApiUrl + '/' + id;
    $.ajax({
      url: url,
      type: 'GET',
      headers: headers,
      success: function(res) {
        var url = api + "/api/v1/signedUrl?jwt=" + res.downloadFileJWT
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
};

parseString = function(string) {
  var td = document.createElement("td");
  td.innerHTML = string;
  return td;
};

parseBoolean = function(boolean) {
  var td = document.createElement("td");
  td.innerHTML = boolean;
  return td;
};

parseGroup = function(group) {
  var td = document.createElement("td");
  td.innerHTML = group.groupname;
  return td;
};

function getTableData() {
  return [{
      tableName: "ID",
      datapointField: "id",
      parseFunction: parseNumber
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
      tableName: "BatteryLevel",
      datapointField: "batteryLevel",
      parseFunction: parseNumber
    },
    {
      tableName: "BatteryCharging",
      datapointField: "batteryCharging",
      parseFunction: parseString,
    },
    {
      tableName: "AirplaneMode",
      datapointField: "airplaneModeOn",
      parseFunction: parseBoolean,
    },
    {
      tableName: "File",
      datapointField: "id",
      parseFunction: parseDownload
    },
  ];
}
