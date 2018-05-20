/* global api, timeUtil, user, util */

var devicesApiUrl = api + '/api/v1/devices';
var scheduleApiUrl = api + '/api/v1/schedules';
var filesApiUrl = api + '/api/v1/files';
var schedule = {
  devices: [],
  audioBaits: [],
  nextcombo:100
};

window.onload = function() {
  var headers = {};
  headers = user.getHeaders();
  util.addCustomTypeParser("asWait", timeUtil.parseTimeToSeconds, timeUtil.secondsToReadableTime);
  util.addCustomTypeParser("timeOfDay", timeUtil.parseTimeOfDay);

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
      schedule.devices = result.devices;
      populateDevicesSelect(document.getElementById("deviceSelect"));
      $("#loading-message").addClass("hide");
      $("#choose-device").click(getSchedule).removeClass("hide");
    },
    error: function(err) {
      $("#loading-message").text("Failed to find any devices that you can set.");
      console.log(err);
    }
  });
};

function populateDevicesSelect(deviceSelect) {
  for (var i in schedule.devices.rows) {
    const device = schedule.devices.rows[i];
    util.addOptionElement(deviceSelect, device.devicename, device.id);
  }
}

function getSchedule() {
  var selectDevice = document.getElementById("deviceSelect").selectedOptions[0].textContent;
  var scheduleDeviceUrl = scheduleApiUrl + "/" + selectDevice;
  $.ajax({
    url: scheduleDeviceUrl,
    type: 'GET',
    headers: user.getHeaders(),
    success: function(result) {
      $(".schedule-buttons .save").click(saveSchedule);
      $(".add-another-combo").click(addNewCombo);
      $("#audio-schedule").removeClass("hide");
      $("#choose-device").addClass("hide");
      loadSchedule(result);
    },
    error: function(err) {
      console.log(err);
    }
  });
}

function loadSchedule(result) {

  var devices = result.devices.rows;
  for (var i in devices)  {
    loadDevice(devices[i]);
  }
  $(".schedule-devices .add").click(additionalDevice);

  var form = $("form");
  var schedule = result.schedule;
  if (schedule && schedule.combos) {
    util.populateElements(form, schedule);
    for (var j = 0; j < schedule.combos.length; j++)  {
      addNewCombo(schedule.combos[j]);
    }
  }
  else {
    addNewCombo();
  }
}

function loadDevice(deviceData) {
  var device = $("#device-template .device").clone();
  device.find("label").text(deviceData.devicename);
  device.attr("data-id", deviceData.id);
  device.find("input").click(deleteDevice);
  $('#audio-schedule .devices').append(device);
}

function deleteDevice(element) {
  $(element.target).closest(".device").remove();
}

function deleteAdditionalDevice(element) {
  $(element.target).closest(".additional-device").remove();
}

function additionalDevice() {
  var deviceSelect = $("#additional-device-template .additional-device").clone();
  deviceSelect.find("input").click(deleteAdditionalDevice);
  populateDevicesSelect(deviceSelect.find("select")[0]);
  $('#audio-schedule .devices').append(deviceSelect);
}

function addNewCombo(comboData = null) {
  var combo = $("#schedule-combo-template .schedule-combo").clone();
  if (comboData) {
    util.populateElements(combo, comboData);
  }
  var comboName = "combo" + schedule.nextcombo++;
  util.appendNameTag(combo, comboName);
  combo.find(".add-another-button").click(addAnotherSound);
  combo.attr("data-id", comboName);
  combo.find(".delete").click(deleteCombo);
  $('#audio-schedule .combos').append(combo);

  if (comboData && comboData.sounds && comboData.sounds.length > 0) {
    addFirstSound(comboName, combo, comboData, 0);
    for (var i = 1; i < comboData.sounds.length; i++)  {
      addSound(comboName, combo, comboData, i);
    }
  } else {
    addFirstSound(comboName, combo);
  }
  return combo;
}

function deleteCombo(element) {
  $(element.target).closest(".schedule-combo").remove();
}

// adds the sound but also hides the wait fields.
function addFirstSound(comboName, combo, data = null) {
  var firstSound = addSound(comboName, combo, data);
  firstSound.find(".wait").addClass('hide');
  firstSound.find(".wait input").attr('value', '0s');
  firstSound.find(".delete").addClass('hide');
  firstSound.find("label.play-sound").text("Play sound");
  firstSound.find('option[value="same"]').addClass('hide');
  firstSound.find('option[value="random"]').prop("selected", true);
}

function addSound(comboName, combo, data = null, counter = 0) {
  var sound =$("#sound-template .sound").clone();
  populateWithAllSounds(sound.find("select.sound-file")[0]);

  if (data) {
    util.populateFromNthElements(sound, data, counter);
  }

  sound.find(".delete").click(deleteSound);


  util.appendNameTag(sound, comboName);
  combo.find(".sounds").append(sound);
  return sound;
}

function populateWithAllSounds(soundFileSelect) {
  if (soundFileSelect) {
   for (var i = 0; i < schedule.audioBaits.length; i++) {
      var audioBait = schedule.audioBaits[i];
      let audioName = "sound";
      if (audioBait.details && audioBait.details.name) {
        audioName = audioBait.details.name;
      }
      util.addOptionElement(soundFileSelect, audioName + "-(" + audioBait.id + ")", audioBait.id);
    }
  }
}

function addAnotherSound (element) {
  var combo = $(element.target).closest(".schedule-combo");
  var comboName = combo.attr("data-id");
  addSound(comboName, combo);
}

function deleteSound(element) {
  $(element.target).closest(".sound").remove();
}

function makeScheduleJson() {
  var customTypes = {
    customTypes: {
      asWait: function(valueAsStr) {
        return timeUtil.parseTimeToSeconds(valueAsStr);
      },
      timeOfDay: function(valueAsStr) {
        return valueAsStr;
      }
    }
  };

  var schedule = $('form#audio-schedule').serializeJSON(customTypes);
  schedule = util.combineElementsStartingWith(schedule, "combo");

  return schedule;
}

function makeDevicesArray() {
  const allDeviceIds = [];
  $(".devices .device").each(function() {
    allDeviceIds.push(parseInt($(this).attr("data-id")));
  });

  $(".devices .additional-device select").each(function() {
    const selected_id = parseInt($(this).val());
    if (selected_id) {
      allDeviceIds.push(selected_id);
    }
  });

  return allDeviceIds;
}

function saveSchedule() {
  var schedule = makeScheduleJson();

  var devices = JSON.stringify(makeDevicesArray());

  var props = {
    devices : devices,
    schedule: JSON.stringify(schedule),
  };

  $.ajax({
    url: scheduleApiUrl,
    type: 'POST',
    headers: user.getHeaders(),
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