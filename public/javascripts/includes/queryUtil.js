/*
The server uses Sequelize as an ORM to perform queries.
The server will set "where" equal to the given query, will be slightly modified
for security, so it should follow the format given from Sequelize.
http://docs.sequelizejs.com/manual/tutorial/querying.html#where
*/

/* global user, api, recordingApiUrl, getTableData, viewUrl */

const queryUtil = {};

queryUtil.conditions = {};
queryUtil.nextId = 1;
queryUtil.count = 54;

// Adds a Sequelize condition to the query.
queryUtil.addCondition = function(sequelizeCondition) {
  console.log('Add condition:', sequelizeCondition);
  var id = queryUtil.nextId++;
  queryUtil.conditions[id] = sequelizeCondition;
  queryUtil.updateConditions();
};

// Removes a Sequelize condition with the given ID.
queryUtil.deleteCondition = function(id) {
  console.log('Delete condition: ', id);
  delete queryUtil.conditions[id];
  queryUtil.updateConditions();
};

// Removes the display of the previous query and displays the new one.
queryUtil.updateConditions = function() {
  console.log('Update conditions');
  // Delete display of old query.
  var conditions = document.getElementById('conditions');
  conditions.innerHTML = '';

  // Iterates through each condition displaying it along with a delete button.
  for (var i in queryUtil.conditions) {
    var l = document.createElement('label');
    var deleteButton = document.createElement('input');
    deleteButton.setAttribute('type', 'button');
    deleteButton.value = 'Delete';
    deleteButton.setAttribute(
      'onclick', 'queryUtil.deleteCondition(' + i + ')');
    var br = document.createElement('br');
    l.innerHTML = JSON.stringify(queryUtil.conditions[i]);
    conditions.appendChild(l);
    conditions.appendChild(deleteButton);
    conditions.appendChild(br);
  }
};

// Makes a Sequelize query from the user defined conditions.
queryUtil.fromConditions = function() {
  var query = {};
  for (var i in queryUtil.conditions) {
    var condition = queryUtil.conditions[i];
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

  document.getElementById('active-query').value = JSON.stringify(query);
  queryUtil.sendQuery();
};

// Add conditions

queryUtil.addBeforeDate = function() {
  var date = document.getElementById('before-date').value;
  var sequelizeCondition = {
    recordingDateTime: {
      "$lt": date
    }
  };
  queryUtil.addCondition(sequelizeCondition);
};

queryUtil.addAfterDate = function() {
  var date = document.getElementById('after-date').value;
  var sequelizeCondition = {
    recordingDateTime: {
      "$gt": date
    }
  };
  queryUtil.addCondition(sequelizeCondition);
};

queryUtil.addBeforeTime = function() {
  var time = document.getElementById('before-time').value;
  var sequelizeCondition = {
    recordingTime: {
      "$lt": time
    }
  };
  queryUtil.addCondition(sequelizeCondition);
};

queryUtil.addAfterTime = function() {
  var time = document.getElementById('after-time').value;
  var sequelizeCondition = {
    recordingTime: {
      "$gt": time
    }
  };
  queryUtil.addCondition(sequelizeCondition);
};

queryUtil.addLongerThan = function() {
  var duration = document.getElementById('longer-than').value;
  var sequelizeCondition = {
    duration: {
      "$gt": duration
    }
  };
  queryUtil.addCondition(sequelizeCondition);
};

queryUtil.addShorterThan = function() {
  var duration = document.getElementById('shorter-than').value;
  var sequelizeCondition = {
    duration: {
      "$lt": duration
    }
  };
  queryUtil.addCondition(sequelizeCondition);
};

queryUtil.addDeviceId = function() {
  var id = Number(document.getElementById('device-id').value);
  var sequelizeCondition = {
    DeviceId: id,
  };
  queryUtil.addCondition(sequelizeCondition);
};

queryUtil.inc = function() {
  var offset = document.getElementById('offset');
  var offsetN = Number(offset.value);
  var limitN = Number(document.getElementById('limit').value);
  if (offsetN + limitN < queryUtil.count) {
    offset.value = offsetN + limitN;
  }
  queryUtil.sendQuery();
};

queryUtil.dec = function() {
  var offset = document.getElementById('offset');
  var offsetN = Number(offset.value);
  var limitN = Number(document.getElementById('limit').value);
  var newOffsetVal = offsetN - limitN;
  if (newOffsetVal <= 0) {
    newOffsetVal = 0;
  }
  offset.value = newOffsetVal;
  queryUtil.sendQuery();
};

queryUtil.getAll = function() {
  document.getElementById('active-query').value = '{}';
  queryUtil.sendQuery();
};


queryUtil.sendQuery = function() {
  queryUtil.clearTable();

  // Get query params.
  var query = document.getElementById('active-query').value;
  var limit = Number(document.getElementById('limit').value);
  var offset = Number(document.getElementById('offset').value);
  var headers = {
    where: query,
    limit: limit,
    offset: offset,
  };

  if (user.isLoggedIn()) {
    headers.Authorization = user.getJWT();
  }

  $.ajax({
    url: recordingApiUrl,
    type: 'GET',
    headers: headers,
    success: function(res) {
      console.log('Successful request:', res);
      if (res.result.count === 0) {
        window.alert('No results for query.');
      }
      for (var i in res.result.rows) {
        queryUtil.appendDatapointToTable(res.result.rows[i]);
      }
      document.getElementById('offset').value = res.result.offset;
      document.getElementById('limit').value = res.result.limit;
      queryUtil.count = res.result.count; // number of results from query.
      document.getElementById('count').innerHTML = queryUtil.count +
        ' results.';
    },
    error: function(err) {
      window.alert('Error with query.');
      console.log('Error:', err);
    },
  });
};

// Clears the results table.
queryUtil.clearTable = function() {
  var table = document.getElementById('results-table');
  var rowCount = table.rows.length;
  while (--rowCount) {
    table.deleteRow(rowCount);
  }
};

// Parses throug a Datapoint and adds it to the result table.
queryUtil.appendDatapointToTable = function(datapoint) {
  var table = document.getElementById('results-table');
  var newRow = table.insertRow(table.rows.length);
  var tableData = getTableData();
  newRow.appendChild(queryUtil.datapointViewElement(datapoint));
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
  // Add delete button for datapoint.
  newRow.appendChild(queryUtil.deleteDatapointElement(datapoint, newRow));
};

// Returns an element that links to a page to view the recording.
queryUtil.datapointViewElement = function(datapoint) {
  var link = document.createElement("a");
  link.setAttribute('href', viewUrl + datapoint.id);
  link.setAttribute('target', '_blank');
  link.innerHTML = 'View';
  var td = document.createElement("td");
  td.appendChild(link);
  return td;
};

// Makes a element with a button in it that will delete the datapoint.
queryUtil.deleteDatapointElement = function(datapoint, row) {
  var td = document.createElement("td");
  var button = document.createElement("button");
  button.innerHTML = "Delete";

  var headers = {};
  if (user.isLoggedIn()) {
    headers.Authorization = user.getJWT();
  }
  var id = datapoint.id;

  button.onclick = function() {
    var url = recordingApiUrl + '/' + id;
    $.ajax({
      url: url,
      type: 'DELETE',
      headers: headers,
      success: function(result) {
        console.log("File deleted. ", result);
        console.log(row);
        row.parentNode.removeChild(row);
        window.alert("Datapoint deleted.");
      },
      error: function(err) {
        console.log(err);
        window.alert("Failed deleting datapoint.");
      },
    });
  };
  td.appendChild(button);
  // Return table element
  return td;
};

queryUtil.parseNumber = function(number) {
  var td = document.createElement("td");
  td.innerHTML = number;
  return td;
};

queryUtil.parseLocation = function(location) {
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

queryUtil.parseDuration = function(duration) {
  var td = document.createElement("td");
  td.innerHTML = duration;
  return td;
};

queryUtil.parseTimeOnly = function(dateTime) {
  var td = document.createElement("td");
  if (dateTime == null) {
    return td;
  }
  var d = new Date(dateTime);
  td.innerHTML = d.toLocaleTimeString('en-NZ');
  return td;
};

queryUtil.parseDateOnly = function(dateTime) {
  var td = document.createElement("td");
  if (dateTime == null) {
    return td;
  }
  var d = new Date(dateTime);
  td.innerHTML = d.toLocaleDateString('en-NZ');
  return td;
};

// Generates a Download button to download the recording
queryUtil.parseDownload = function(id) {
  var td = document.createElement("td");
  var button = document.createElement("button");
  button.innerHTML = "Download";

  button.onclick = function() {
    // Get server to generate a JWT for downloading the file.
    var headers = {};
    if (user.isLoggedIn()) {
      headers.Authorization = user.getJWT();
    }
    var url = recordingApiUrl + '/' + id;
    $.ajax({
      url: url,
      type: 'GET',
      headers: headers,
      success: function(res) {
        var url = api + "/api/v1/signedUrl?jwt=" + res.jwt;
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

queryUtil.parseString = function(string) {
  var td = document.createElement("td");
  td.innerHTML = string;
  return td;
};

queryUtil.parseBoolean = function(boolean) {
  var td = document.createElement("td");
  td.innerHTML = boolean;
  return td;
};

queryUtil.parseGroup = function(group) {
  var td = document.createElement("td");
  if (typeof group !== 'string') {
    td.innerHTML = 'No group';
  } else {
    td.innerHTML = group;
  }
  return td;
};
