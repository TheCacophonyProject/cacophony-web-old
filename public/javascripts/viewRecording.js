/* global api, tags, user, id */

/* exported goToStartTime, goToEndTime, setStartTimeAsCurrentTime, setEndTimeAsCurrentTime,
  deleteRecording, updateComment */


var recordingsApiUrl = api + '/api/v1/recordings';
var recording = null;

document.onkeypress = function (e) {
  if (document.activeElement.tagName.toUpperCase() != 'BODY') { return; }
  var key = e.key;
  if (key == 'n') {
    nextRecording("next", "no-human");
  } else if (key == 'f') {
    falsePositive();
  } else if (key == 'a') {
    tags.new();
  }
};

window.onload = function() {
  var headers = {};
  if (user.isLoggedIn()) {headers.Authorization = user.getJWT();}
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
    {document.getElementById([setToDefaults[i]]).value = defaults[setToDefaults[i]];}
  }
};

function getRecordingError(result) {
  console.log(result);
  console.log("ERROR");
}

function nextRecording(direction, tagMode, tags) {
  if (recording == null) {return;}

  var query = {
    DeviceId: recording.Device.id,
  };
  var order;
  switch (direction) {
  case "next":
    query.recordingDateTime = {gt: recording.recordingDateTime};
    order = "ASC";
    break;
  case "previous":
    query.recordingDateTime = {lt: recording.recordingDateTime};
    order = "DESC";
    break;
  default:
    throw `invalid direction: '${direction}'`;
  }

  if (!tags) {
    tags = null;
  }

  var headers = {};
  if (user.isLoggedIn()) {headers.Authorization = user.getJWT();}
  $.ajax({
    url: recordingsApiUrl,
    type: 'GET',
    data: {
      where: JSON.stringify(query),
      tagMode: tagMode,
      tags: JSON.stringify(tags),
      limit: 1,
      offset: 0,
      order: JSON.stringify([["recordingDateTime", order]]),
    },
    headers: headers,
    success: function(res) {
      if (res.rows.length == 0) {
        window.alert(`No ${direction} recording from this device.`);
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



function getRecordingSuccess(result) {
  if (!result.success) {
    //TODO deal with not getting a recording back
    return;
  }
  recording = result.recording;
  console.log(recording);
  switch(result.recording.type) {
  case 'thermalRaw':
    parseThermalRaw(result);
    break;
  }
  tags.load(result.recording.Tags);
}

function parseThermalRaw(result) {
  console.log("Got a thermal raw data");
  // Add event listner to set end time to length - 10 seconds.
  var player = document.getElementById('player');
  player.addEventListener('loadedmetadata', function() {
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
    window.alert("Recording has not been processed yet.");
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
  seconds = Math.ceil(seconds);
  var minutes = Math.floor(seconds/60);
  seconds = seconds % 60;
  if (seconds < 10) {
    return minutes + ":0" + seconds;
  } else {
    return minutes + ":" + seconds;
  }
}

function goToStartTime() {
  var minutes = document.getElementById('tagStartTimeInput').value.split(':')[0];
  var seconds = document.getElementById('tagStartTimeInput').value.split(':')[1];
  document.getElementById('player').currentTime = minutes * 60 + seconds;
}

function goToEndTime() {
  var minutes = document.getElementById('tagStopTimeInput').value.split(':')[0];
  var seconds = document.getElementById('tagStopTimeInput').value.split(':')[1];
  document.getElementById('player').currentTime = minutes * 60 + seconds;
}

function setStartTimeAsCurrentTime() {
  var seconds = Math.floor(document.getElementById('player').currentTime);
  document.getElementById('tagStartTimeInput').value = secondsToMMSS(seconds);
}

function setEndTimeAsCurrentTime() {
  var seconds = Math.ceil(document.getElementById('player').currentTime);
  document.getElementById('tagStopTimeInput').value = secondsToMMSS(seconds);
}

function falsePositive() {
  tags.send({event: "false positive"});
}

function deleteRecording() {
  var headers = {};
  if (user.isLoggedIn()) {headers.Authorization = user.getJWT();}
  $.ajax({
    url: recordingsApiUrl + '/' + id,
    type: 'DELETE',
    headers: headers,
    success: function(res) {
      console.log(res);
      nextRecording('next', 'any');
    },
    error: function(err) {
      console.log(err);
      window.alert("Error with deleting recording.");
    },
  });
}

function updateComment() {
  var comment = document.getElementById('comment-text').value;
  var headers = {};
  if (user.isLoggedIn()) {headers.Authorization = user.getJWT();}
  $.ajax({
    url: recordingsApiUrl + '/' + id,
    type: 'PATCH',
    headers: headers,
    data: {updates: JSON.stringify({comment: comment})},
    success: function(res) {
      console.log(res);
      window.alert("Saved comment.");
    },
    error: function(err) {
      console.log(err);
      console.log(err.responseJSON.messages);
      window.alert("Failed to save comment.");
    },
  });
}
