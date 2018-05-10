
var devicesApiUrl = api + '/api/v1/devices';
var scheduleApiUrl = api + '/api/v1/schedules';
var filesApiUrl = api + '/api/v1/files';
var schedule = {
  devices: [],
  audioBaits: [],
  nextcombo:100,
};

window.onload = function() {
  var headers = {};
  headers = user.getHeaders();


  $.ajax({
    url: filesApiUrl,
    type: 'GET',
    headers: headers,
    data:  {where: JSON.stringify({type: "audioBait"})},
    dataType: 'json',

    success: function(result) {
      schedule.audioBaits = result.rows;
    },
    error: function(err) {
      console.log(err);
    }
  });
  $.ajax({
    url: devicesApiUrl,
    type: 'GET',
    headers: user.getHeaders(),
    success: function(result) {
      devices = result.devices;
      var deviceSelect = document.getElementById("deviceSelect");
      for (var i in result.devices.rows) {
        var device = result.devices.rows[i];
        var option = document.createElement("option");
        option.innerText = device.devicename;
        option.id = device.id;
        deviceSelect.appendChild(option);
      }
      $("#loading-message").addClass("hide");
      $("#choose-device").removeClass("hide");
    },
    error: function(err) {
      $("#loading-message").text("Failed to find any devices that you can set.")
      console.log(err);
    }
  });
};

loadUserDevices = function() {
}

getSchedule = function() {
  var selectDevice = document.getElementById("deviceSelect").selectedOptions[0].textContent;
  var scheduleDeviceUrl = scheduleApiUrl + "/" + selectDevice;
  $.ajax({
    url: scheduleDeviceUrl,
    type: 'GET',
    headers: user.getHeaders(),
    success: function(result) {
      $("#audio-schedule").removeClass("hide");
      $("#choose-device").addClass("hide");
      loadSchedule(result);
    },
    error: function(err) {
      console.log(err);
    }
  });
}

loadSchedule = function(result) {
  $('#device-name').text(result.devicename);
  $('#device-name').attr("data-id", result.deviceid);

  var soundsSelect = document.getElementById("sound_file");

  if (jQuery.isEmptyObject(result.schedule)) {
    addNewCombo();
  }
}

addNewCombo = function() {
  var combo = $("#schedulecomboTemplate .schedulecombo").clone()
  var comboName = "combo" + schedule.nextcombo++;
  util.appendNameTag(combo, comboName);
  combo.find(".add-another-button").attr("onClick", 'addAnotherSound("' + comboName + '");');
  combo.attr("data-id", comboName);
  $('#audio-schedule').append(combo);

  var firstSound = addSound(comboName, combo);
  firstSound.find(".wait").addClass('hide');
  firstSound.find(".wait input").attr('value', '0s');

  return combo;
}

addSound = function(comboName, combo) {
  var sound =$("#soundTemplate .sound").clone();
  util.appendNameTag(sound, comboName);
  combo.find(".sounds").append(sound);
  return sound;
}

addAnotherSound = function(comboName) {
  var combo = $('.schedulecombo[data-id="' + comboName + '"]');
  addSound(comboName, combo);
}

makeScheduleJson = function(event) {
  var schedule = $('form#audio-schedule').serializeJSON();
  schedule = util.combineElementsStartingWith(schedule, "combo");

  for (var i = 0; i < schedule["combo"]; i++) {
    var combo = schedule["combo"][i];
    util.combineElementsStartingWith(combo, "sound");
  }

  return schedule;
}

saveSchedule = function(event) {
  event.preventDefault();
  var props = {
    devices : "[1440]",
    schedule: JSON.stringify({description: "wonderwhy2"}),
  }
  headers = user.getHeaders();
  // headers.contentType = "application/json; charset=utf8";

  var schedule = makeScheduleJson();
  console.log(schedule);

  $.ajax({
    url: scheduleApiUrl,
    type: 'POST',
    headers: headers,
    data:  props,
    dataType: 'json',

    success: function() {
      alert('save successful');
    },
    error: function(err) {
      console.log(err);
    }
  });
}