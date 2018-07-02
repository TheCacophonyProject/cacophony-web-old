/* global api, user, jQuery */

var filesApiUrl = api + '/api/v1/files';

window.onload = function() {
  $(".upload-button").click(uploadAudioBait);
  $('form input[name="animal"]').change(setCacophonyName);
  $('form input[name="sound"]').change(setCacophonyName);
  setCacophonyName();
};

function setCacophonyName() {
  let animal = $('form input[name="animal"]').val();
  let sound = $('form input[name="sound"]').val();

  let cacophonyName = "";
  if (animal) {
    cacophonyName = animal;
  }
  if (animal && sound) {
    cacophonyName += "-";
  }
  if (sound) {
    cacophonyName += sound;
  }
  if (cacophonyName === "") {
    cacophonyName = "sound";
  }

  $('form input[name="name"]').val(cacophonyName);
}

function uploadAudioBait() {
  var headers = {};
  if (user.isLoggedIn()) {
    headers.Authorization = user.getJWT();
  }

  var data = new FormData();

  var props = {
    "type":"audioBait",
    "details": $('form').serializeJSON(),
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