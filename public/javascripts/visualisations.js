/* global Chart, user, api */

var recordingsApiUrl = api + '/api/v1/recordings';
var devicesApiUrl = api + '/api/v1/devices';

window.onload = async function() {
  // let query = {type: 'thermalRaw'};
  let query = {type: 'thermalRaw'};
  let deviceResponse = await getDevices();
  let devices = await deviceResponse.devices.rows;
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
  graphDeviceRecordingCount(devices, query);
};

async function getDevices() {
  let response = await fetchData(devicesApiUrl);
  return response;
}

async function graphDeviceRecordingCount(devices, query) {
  showLoader();
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
  let colors = data.map(() => colorPicker());
  // Create dataset suitable for ChartJS
  let dataset = [{
    label: "Number of recordings",
    data: data.map((item) => item.count),
    backgroundColor: colors,
    borderColor: colors,
    borderWidth: 1
  }];

  hideLoader();
  // Draw the chart
  drawBarChart(labels, dataset, "Total recordings on each device", "Device name", "Number of recordings");
}

// Draw chart
function drawBarChart(labels, datasets, title, xAxisLabel, yAxisLabel) {
  let myChart = document.getElementById("myChart");
  new Chart(myChart, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
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
