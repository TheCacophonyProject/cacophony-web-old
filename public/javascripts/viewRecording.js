var recordingsApiUrl = api + '/api/v1/recordings'
var recording = null;

document.onkeypress = function (e) {
  var key = e.key;
  if (key == 'n') {
    nextRecording(false);
  } else if (key == 'f') {
    falsePositive();
  } else if (key == 'a') {
    tags.new();
  }
};

window.onload = function() {
  headers = {};
  if (user.isLoggedIn()) headers.Authorization = user.getJWT();
  $.ajax({
    url: recordingsApiUrl + '/' + id,
    type: 'GET',
    headers: headers,
    success: getRecordingSuccess,
    error: getRecordingError,
  });

  // Load tags defaults
  var defaults = user.getTagDefaults();
  var setToDefaults = ['tagAnimalInput', 'tagEventInput', 'tagTrapTypeInput'];
  for (var i in setToDefaults) {
    if (defaults[setToDefaults[i]] != undefined)
      document.getElementById([setToDefaults[i]]).value = defaults[setToDefaults[i]];
  }
}

function getRecordingError(result) {
  console.log(result);
  console.log("ERROR");
}

function previousRecording(tagged) {
  console.log('Go to previous recording.');
  // Goes to the previous recording from that device.
  if (recording == null) return;
  var query = {
    DeviceId: recording.Device.id,
    recordingDateTime: {lt: recording.recordingDateTime},
  };
  if (tagged == false) {
    query._tagged = false;
  }
  headers = {};
  if (user.isLoggedIn()) headers.Authorization = user.getJWT();
  $.ajax({
    url: recordingsApiUrl,
    type: 'GET',
    data: {
      where: JSON.stringify(query),
      limit: 1,
      offset: 0,
    },
    headers: headers,
    success: function(res) {
      if (res.rows.length == 0) {
        window.alert("No previous recording from this device.");
        return;
      }
      window.location.href = "/view_recording/"+res.rows[0].id;
    },
    error: function(err) {
      console.log('Error');
      console.log(err);
    },
  });
}

function nextRecording(tagged) {
  console.log('Go to next recording.')
  // Goes to the next recording from that device
  if (recording == null) return;
  var query = {
    DeviceId: recording.Device.id,
    recordingDateTime: {gt: recording.recordingDateTime},
  };
  if (tagged == false) {
    query._tagged = false;
  }
  headers = {};
  if (user.isLoggedIn()) headers.Authorization = user.getJWT();
  $.ajax({
    url: recordingsApiUrl,
    type: 'GET',
    data: {
      where: JSON.stringify(query),
      limit: 1,
      offset: 0,
      order: '[["recordingDateTime", "ASC"]]',
    },
    headers: headers,
    success: function(res) {
      if (res.rows.length == 0) {
        window.alert("No next recording from this device.");
        return;
      }
      window.location.href = "/view_recording/"+res.rows[0].id;
    },
    error: function(err) {
      console.log('Error');
      console.log(err);
    },
  });
}

function getRecordingSuccess(result, status) {
  if (!result.success)
    //TODO deal with not getting a recording back
    return;
  recording = result.recording;
  console.log(recording);
  switch(result.recording.type) {
    case 'thermalRaw':
      parseThermalRaw(result)
      break;
  }
  tags.load(result.recording.Tags);
}

function parseThermalRaw(result) {
  console.log("Got a thermal raw data");
  // Add event listned to set end time to lenght - 10 seconds.
  var player = document.getElementById('player');
  player.addEventListener('loadedmetadata', function(res) {
    document.getElementById('tagStopTimeInput').value =
      secondsToMMSS(player.duration - 10);
  });
  player.addEventListener('loadstart', function(res) { res.target.play(); });

  // Set source for player
  var source = document.createElement('source');
  if (result.downloadFileJWT != null) {
    source.src = api + "/api/v1/signedUrl?jwt=" + result.downloadFileJWT;
    player.appendChild(source);
  } else {
    window.alert("Recording has not been processed yet.")
  }

  // Get metadata.
  var date = new Date(result.recording.recordingDateTime);
  document.getElementById('date-text').innerHTML = date.toLocaleDateString();
  document.getElementById('time-text').innerHTML = date.toLocaleTimeString();
  document.getElementById('device-text').innerHTML =
    result.recording.Device.devicename;
  document.getElementById('processing-state-text').innerHTML =
    result.recording.processingState;
  document.getElementById('comment-text').value = result.recording.comment;
}

function secondsToMMSS(seconds) {
  seconds = Math.ceil(seconds)
  minutes = Math.floor(seconds/60);
  seconds = seconds%60;
  if (seconds < 10)
    return minutes + ":0" + seconds;
  else
    return minutes + ":" + seconds;
}

function goToStartTime() {
  minutes = document.getElementById('tagStartTimeInput').value.split(':')[0]
  seconds = document.getElementById('tagStartTimeInput').value.split(':')[1]
  document.getElementById('player').currentTime = minutes * 60 + seconds;
}

function goToEndTime() {
  minutes = document.getElementById('tagStopTimeInput').value.split(':')[0]
  seconds = document.getElementById('tagStopTimeInput').value.split(':')[1]
  document.getElementById('player').currentTime = minutes * 60 + seconds;
}

function setStartTimeAsCurrentTime() {
  var seconds = Math.floor(document.getElementById('player').currentTime)
  document.getElementById('tagStartTimeInput').value = secondsToMMSS(seconds);
}

function setEndTimeAsCurrentTime() {
  var seconds = Math.ceil(document.getElementById('player').currentTime)
  document.getElementById('tagStopTimeInput').value = secondsToMMSS(seconds);
}

function falsePositive() {
  tags.send({event: "false positive"})
}

function deleteRecording() {
  headers = {};
  if (user.isLoggedIn()) headers.Authorization = user.getJWT();
  $.ajax({
    url: recordingsApiUrl + '/' + id,
    type: 'DELETE',
    headers: headers,
    success: function(res) {
      console.log(res);
      window.alert("Deleted recording.")
    },
    error: function(err) {
      console.log(err);
      window.alert("Error with deleting recording.");
    },
  });
}

function updateComment() {
  var comment = document.getElementById('comment-text').value;
  headers = {};
  if (user.isLoggedIn()) headers.Authorization = user.getJWT();
  $.ajax({
    url: recordingsApiUrl + '/' + id,
    type: 'PATCH',
    headers: headers,
    data: {updates: JSON.stringify({comment: comment})},
    success: function(res) {
      console.log(res);
      window.alert("Saved comment.")
    },
    error: function(err) {
      console.log(err);
      console.log(err.responseJSON.messages);
      window.alert("Failed to save comment.");
    },
  });
}
