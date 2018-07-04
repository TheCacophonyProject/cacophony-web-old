/* global Chart, user, api */

var recordingsApiUrl = api + '/api/v1/recordings';
var devicesApiUrl = api + '/api/v1/devices';

window.onload = async function() {
  let query = {type: 'thermalRaw'};
  let deviceResponse = await getDevices();
  let devices = await deviceResponse.devices.rows;
  graphDeviceRecordingCount(devices, query);
};

async function getDevices() {
  let response = await fetchData(devicesApiUrl);
  return response;
}

async function graphDeviceRecordingCount(devices, query) {
  showLoader();
  // Initiate data and label variables
  let labels = [];
  let data = [];
  // Set query parameters
  let limit = 1;
  let offset = 0;
  let tagMode = "any";
  for (let device of devices) {
    // Get recording count for each device
    query.DeviceId = device.id;
    let url = getRecordingURL(query, limit, offset, tagMode);
    let response = await fetchData(url);
    let recordingCount = response.count;
    data.push({
      id: device.id,
      count: recordingCount,
      devicename: device.devicename
    });
    // Add label for each device
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
  console.log(hue);
  let hsl = `hsl(${hue}, 80%, 50%)`;
  return hsl;
}
