/* global api, user, util */

/* exported getSchedule, saveSchedule, addNewCombo, addAnotherSound */

var devicesApiUrl = api + '/api/v1/devices';
var scheduleApiUrl = api + '/api/v1/schedules';
var filesApiUrl = api + '/api/v1/files';
var schedule = {
  devices: [],
  audioBaits: [],
  nextcombo:100,
  comboSelector: ".schedule-combo",
  soundSelector: ".sound",
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
      schedule.devices = result.devices;
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
      $("#loading-message").text("Failed to find any devices that you can set.");
      console.log(err);
    }
  });
};


function getSchedule() {
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

function loadSchedule(result) {
  $('#device-name').text(result.devicename);
  $('#device-name').attr("data-id", result.deviceid);

  var form = $("form");
  var schedule = result.schedule;
  if (schedule) {

    util.populateElements(form, schedule);

    if (schedule.combos) {
      for (var i = 0; i < schedule.combos.length; i++)  {
        addNewCombo(schedule.combos[i]);
      }
    }
    else {
      addNewCombo();
    }
  }

}

function addNewCombo(comboData = null) {
  var combo = $("#schedule-combo-template .schedule-combo").clone();
  if (comboData) {
    util.populateElements(combo, comboData);
  }
  var comboName = "combo" + schedule.nextcombo++;
  util.appendNameTag(combo, comboName);
  combo.find(".add-another-button").attr("onClick", 'addAnotherSound("' + comboName + '");');
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
}

function addSound(comboName, combo, data = null, counter = 0) {
  var sound =$("#sound-template .sound").clone();

  sound.find(".delete").click(deleteSound);

  var soundFileSelect = sound.find("select.sound_file")[0];
  for (var i = 0; i < schedule.audioBaits.length; i++) {
    var audioBait = schedule.audioBaits[i];
    util.addOptionElement(soundFileSelect, "file " + audioBait.id, audioBait.id);
  }


  if (data) {
    util.populateFromNthElements(sound, data, counter);
  }

  util.appendNameTag(sound, comboName);
  combo.find(".sounds").append(sound);
  return sound;
}

function addAnotherSound (comboName) {
  var combo = $('.schedule-combo[data-id="' + comboName + '"]');
  addSound(comboName, combo);
}

function deleteSound(element) {
  $(element.target).closest(".sound").remove();
}

function makeScheduleJson() {
  var schedule = $('form#audio-schedule').serializeJSON();
  schedule = util.combineElementsStartingWith(schedule, "combo");

  return schedule;
}

function saveSchedule(event) {
  event.preventDefault();
  var schedule = makeScheduleJson();

  var devices = "[" + $('#device-name').attr("data-id") + "]";
  devices.replace('"','');

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