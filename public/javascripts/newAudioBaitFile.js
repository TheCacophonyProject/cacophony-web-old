/* global api, user, jQuery */

/* exported uploadAudioBait */

var filesApiUrl = api + '/api/v1/files';

function uploadAudioBait() {
  var headers = {};
  if (user.isLoggedIn()) {headers.Authorization = user.getJWT();}

  var data = new FormData();

  var props = {
    "type":"audiobait",
    "details": {},
  };

  jQuery.each($('#audio_bait_file')[0].files, function(i, file) {
    data.append('file', file);
    props.details.originalName = file.name;
  });
  data.append("data", JSON.stringify(props));

  $.ajax({
    url: filesApiUrl,
    headers: headers,
    data: data,
    cache: false,
    contentType: false,
    processData: false,
    method: 'POST',
    success: function(){
      alert('Success upload');
    },
    error: function (jqXHR, exception) {
      var msg = '';
      if (jqXHR.status === 0) {
        msg = 'Not connect.\n Verify Network.';
      } else if (jqXHR.status == 404) {
        msg = 'Requested page not found. [404]';
      } else if (jqXHR.status == 500) {
        msg = 'Internal Server Error [500].';
      } else if (exception === 'parsererror') {
        msg = 'Requested JSON parse failed.';
      } else if (exception === 'timeout') {
        msg = 'Time out error.';
      } else if (exception === 'abort') {
        msg = 'Ajax request aborted.';
      } else {
        msg = 'Uncaught Error.\n' + jqXHR.responseText;
      }
      alert(msg);
    },
  });
}