/* global api, timeUtil, user, util */

var devicesApiUrl = api + '/api/v1/devices';
var scheduleApiUrl = api + '/api/v1/schedules';
var filesApiUrl = api + '/api/v1/files';
var schedule = {
  devices: [],
  nextcombo:100,
  allAudioBaitIds: [],
};

window.onload = function() {
  var headers = {};
  headers = user.getHeaders();
  util.addCustomTypeParser("asWait", timeUtil.parseTimeToSeconds, timeUtil.secondsToReadableTime);
  util.addCustomTypeParser("timeOfDay", timeUtil.timeOfDayTo24Clock, timeUtil.timeOfDayToAmPm);

  $.ajax({
    url: filesApiUrl,
    type: 'GET',
    headers: headers,
    data:  {where: JSON.stringify({type: "audioBait"})},
    dataType: 'json',

    success: function(result) {
      for (var i = 0; i < result.rows.length; i++) {
        schedule.allAudioBaitIds.push(result.rows[i].id);
      }

      populateWithAllSounds(result.rows, $("#sound-template select.sound-file"));
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
  if (selectDevice !== "<select your device>") {
    var scheduleDeviceUrl = scheduleApiUrl + "/" + selectDevice;
    $.ajax({
      url: scheduleDeviceUrl,
      type: 'GET',
      headers: user.getHeaders(),
      success: function(result) {
        $(".schedule-buttons .save").click(saveSchedule);
        $(".add-another-combo").click(addNewCombo);
        $("#audio-schedule").removeClass("hide");
        $("#choose-action").addClass("hide");
        loadSchedule(result);
      },
      error: function(err) {
        console.log(err);
      }
    });
  }
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
  let combo = util.createNewAndPopulate("#schedule-combo-template", comboData);

  let comboName = "combo" + schedule.nextcombo++;
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
  let sound = util.createNewAndPopulateFromArray("#sound-template", data, counter);

  sound.find(".delete").click(deleteSound);
  util.appendNameTag(sound, comboName);
  combo.find(".sounds").append(sound);
  return sound;
}

function populateWithAllSounds(audiobaits, soundFileSelect) {
  if (soundFileSelect) {
    for (var i = 0; i < audiobaits.length; i++) {
      var audioBait = audiobaits[i];
      let audioName = "sound";
      if (audioBait.details && audioBait.details.name) {
        audioName = audioBait.details.name;
      }
      util.addOptionElement(soundFileSelect[0], audioName + "-(" + audioBait.id + ")", audioBait.id);
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

function makeScheduleMap() {
  var customTypes = {
    customTypes: {
      asWait: function(valueAsStr) {
        return timeUtil.parseTimeToSeconds(valueAsStr);
      },
      timeOfDay: function(valueAsStr) {
        return timeUtil.timeOfDayTo24Clock(valueAsStr);
      }
    }
  };

  var scheduleMap = $('form#audio-schedule').serializeJSON(customTypes);
  scheduleMap = util.combineElementsStartingWith(scheduleMap, "combo");
  scheduleMap.allsounds = schedule.allAudioBaitIds;

  return scheduleMap;
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
  $(document.activeElement).trigger("change");

  var scheduleMap = makeScheduleMap();

  var devices = JSON.stringify(makeDevicesArray());

  var props = {
    devices : devices,
    schedule: JSON.stringify(scheduleMap),
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