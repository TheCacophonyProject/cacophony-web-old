/* global Chart, user, api */

var recordingsApiUrl = api + '/api/v1/recordings';
var devicesApiUrl = api + '/api/v1/devices';
var theChart;

window.onload = async function() {
  let title = "Recordings on each device";
  let xAxisLabel = "Device name";
  let yAxisLabel = "Number of recordings";
  createEmptyGraph(title, xAxisLabel, yAxisLabel);
  updateGraph();
};

function createEmptyGraph(title, xAxisLabel, yAxisLabel) {
  let myChart = document.getElementById("myChart");
  theChart = new Chart(myChart, {
    type: 'bar',
    options: {
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero:true
          },
          scaleLabel: {
            display: true,
            labelString: yAxisLabel
          }
        }],
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: xAxisLabel
          }
        }]
      },
      title: {
        display: true,
        text: title
      },
      legend: {
        display: false
      }
    }
  });
}

async function updateGraph() {
  showLoader();
  // Extract query information
  let query = {type: 'thermalRaw'};
  query.recordingDateTime = dateQuery();
  console.log('Query:\n', query);
  // Get devices
  let devices = await getDevices();
  // Set query parameters
  let limit = 1000;
  let offset = 0;
  let tagMode = "any";
  // Get all data (first 1000 rows)
  let url = getRecordingURL(query, limit, offset, tagMode);
  let allData = await fetchData(url);
  // Check whether all data was fetched - if not, run fetch again to get all rows
  if (allData.count > limit) {
    limit = allData.count;
    let url = getRecordingURL(query, limit, offset, tagMode);
    allData = await fetchData(url);
  }
  // Create empty object to store number of recordings for each deviceId
  let deviceCount = {};
  devices.map((device) => deviceCount[device.id] = 0);
  // For each recording, increment the device count
  for (let row of allData.rows) {
    deviceCount[row.Device.id] += 1;
  }
  // Create data and label variables
  let labels = [];
  let data = [];
  for (let device of devices) {
    data.push({
      id: device.id,
      count: deviceCount[device.id],
      devicename: device.devicename
    });
    labels.push(device.devicename);
  }
  // Create colors for bar graphs
  lastHue = -60; // reset starting hue
  let colors = data.map(() => colorPicker());
  // Create dataset suitable for ChartJS
  let dataset = [{
    label: "Number of recordings",
    data: data.map((item) => item.count),
    backgroundColor: colors,
    borderColor: colors,
    borderWidth: 1
  }];
  let title = `Recordings on each device (Last ${getDateRange()} days)`;

  hideLoader();
  // Draw the chart
  updateBarChart(labels, dataset, title);
}

function updateBarChart(labels, datasets, title) {
  theChart.data.labels = labels;
  theChart.data.datasets = datasets;
  theChart.options.title.text = title;
  theChart.update();
}

async function getDevices() {
  let response = await fetchData(devicesApiUrl);
  let devices = response.devices.rows;
  // Sort devices alphabetically by devicename
  devices.sort(function(a, b) {
    var nameA = a.devicename.toUpperCase(); // ignore upper and lowercase
    var nameB = b.devicename.toUpperCase(); // ignore upper and lowercase
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    // names must be equal
    return 0;
  });
  return devices;
}

function getRecordingURL(query, limit, offset, tagMode) {
  // Create query string to add to api url
  let params = {
    where: JSON.stringify(query),
    limit: limit,
    offset: offset,
    tagMode: tagMode
  };
  let queryString = Object.keys(params).map((key) => {
    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
  }).join('&');
  let url = recordingsApiUrl + "?" + queryString;
  return url;
}

async function fetchData(url) {
  // Add auth to headers
  let myHeaders = new Headers();
  myHeaders.append('Authorization', user.getJWT());
  let options = {
    method: 'GET',
    headers: myHeaders,
    mode: 'cors',
    cache: "no-cache",
  };

  let myRequest = new Request(url, options);
  // Run the fetch command
  let response = await fetch(myRequest);
  // Check if the request was successful
  if (response.ok) {
    // Try to process the JSON result
    try {
      let result = await response.json();
      return await result;
    } catch(error) {
      // Error will throw if response not in JSON format
      console.log('Error in fetchData in visualisations');
      console.log('Failed when attempting to process the JSON');
      console.log(error);
    }
  } else {
    // Throw a tantrum!
    throw new Error(response.status);
  }
}

function showLoader() {
  let loader = document.getElementById('loader');
  loader.style.display = "block";
}

function hideLoader() {
  let loader = document.getElementById('loader');
  loader.style.display = "none";
}

var lastHue = -60;
function colorPicker() {
  let hue;
  if (lastHue < 360) {
    hue = lastHue + 60;
    lastHue = hue;
  } else {
    hue = lastHue - 339;
    lastHue = hue;
  }
  let hsl = `hsl(${hue}, 80%, 50%)`;
  return hsl;
}

function getDateRange() {
  let dateParent = document.getElementById('date');
  for (let date of dateParent.children) {
    if (date.classList.contains('active')) {
      return date.getAttribute('data-value');
    }
  }
}

function dateQuery() {
  let days = Number(getDateRange()); // number of days to go back in time
  if (days === 0) {
    return;
  } else {
    let today = new Date(Date.now()); // today
    let todayms = today.getTime(); // today in ms
    let daysms = days*24*60*60*1000; // days to go back in ms
    let fromdatems = todayms - daysms; // from date in ms
    let fromDate = parseDate(new Date(fromdatems)); // from date as text
    let toDate = parseDate(today); // to date as text
    let query = {};
    if (fromDate !== "" || toDate !== "") {
      query.recordingDateTime = {};
    }
    if (fromDate !== "") {
      query.recordingDateTime["$gt"] = fromDate;
    }
    if (toDate != "") {
      query.recordingDateTime["$lt"] = toDate;
    }
    return query.recordingDateTime;
  }
}

function parseDate(date) {
  let day = (0 + date.getDate().toString()).slice(-2);
  let month = (0 + (date.getMonth() + 1).toString()).slice(-2);
  let year = date.getFullYear();
  return year + "-" + month + "-" + day;
}
