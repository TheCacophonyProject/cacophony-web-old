var audioApiUrl = api + "/api/v1/audiorecordings";
var recording = null;

window.onload = function() {
  var headers = { where: '{"id": ' + id + '}' };
  if (user.isLoggedIn()) headers.Authorization = user.getJWT();
  $.ajax({
    url: audioApiUrl,
    type: 'get',
    headers: headers,
    success: requestSuccess,
    error: requestError
  });
  // Get a tempory URL (10 minutes) that can be used as the audio source
  getPlayerSource(document.getElementById('player'));
  $("#delete-button").click(deleteDatapoint);
  tags.recordingsIds = { audioId: id };
};

function requestError(err) {
  console.log(err);
  window.alert(err);
}

function requestSuccess(res) {
  recording = res.result.rows[0];
  console.log(recording);
  document.getElementById('time-text').innerHTML = getStartTimeText();
  document.getElementById('date-text').innerHTML = getRecordingDateText();
  document.getElementById('location-text').innerHTML = getLocationText();
  document.getElementById('relative-to-dawn-text').innerHTML =
    getRelativeToDawnText();
  document.getElementById('relative-to-dusk-text').innerHTML =
    getRelativeToDuskText();
  document.getElementById('version-number-text').innerHTML =
    getVersionNumberText();
  document.getElementById('additional-metadata-text').innerHTML =
    getAdditionalMetadataText();
  tags.load(recording.tags);

}

function getAdditionalMetadataText() {
  return JSON.stringify(recording.additionalMetadata);
}

function getVersionNumberText() {
  return recording.version;
}

function getRelativeToDawnText() {
  return recording.relativeToDawn;
}

function getRelativeToDuskText() {
  return recording.relativeToDusk;
}

function getRecordingDateText() {
  if (recording.recordingDateTime == null) {
    return "no date given."
  } else {
    var d = new Date(recording.recordingDateTime);
    return d.toLocaleDateString('en-NZ');
  }
}

function getStartTimeText() {
  return recording.recordingTime;
}

function getLocationText() {
  return recording.location;
}

function getPlayerSource(player) {
  $.ajax({
    url: audioApiUrl + "/" + id,
    type: 'get',
    headers: { Authorization: user.getJWT() },
    success: function(response) {
      var source = document.createElement('source');
      source.src = api + "/api/v1/signedUrl?jwt=" + response.jwt;;
      player.appendChild(source);
    },
    error: function(err) { console.log(err); }
  });
}

function deleteDatapoint() {
  $.ajax({
    url: audioApiUrl + '/' + id,
    type: 'DELETE',
    headers: { Authorization: user.getJWT() },
    success: function() { window.alert("Datapoint deleted."); },
    error: function(err) {
      console.log(err);
      window.alert("Failed to delete datapoint.");
    }
  });
}
