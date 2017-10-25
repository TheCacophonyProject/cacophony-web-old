var recordingsApiUrl = api + '/api/v1/recordings'
var recording = null;

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
}

function getRecordingError(result) {
  console.log(result);
  console.log("ERROR");
}

function getRecordingSuccess(result) {
  console.log(result);
  if (!result.success)
    //TODO deal with not getting a recording back
    return;

  switch(result.recording.type) {
    case 'thermalRaw':
      parseThermalRaw(result)
      break;
  }
  tags.load(result.recording.Tags);
}

function parseThermalRaw(result) {
  console.log("Got a thermal raw data");

  // Set source for player
  var source = document.createElement('source');
  source.src = api + "/api/v1/signedUrl?jwt=" + result.downloadFileJWT;
  document.getElementById('player').appendChild(source);

  // Display metadata for recording
  //TODO
}
