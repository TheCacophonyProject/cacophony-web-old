/*
Contains the tagging functions (delete, load, new).
*/

tags = {};

/**
 * Deletes a tag.
 */
tags.delete = function(event) {
  var id = event.target.tagId;
  $.ajax({
    url: api+'/api/v1/tags',
    type: 'DELETE',
    headers: { 'Authorization': user.getJWT() },
    data: { "tagId": id },
    success: function() {
      var row = event.target.parentNode.parentNode;
      row.parentNode.removeChild(row);
    },
    error: function(err) {
      console.log("Error with deleting tag:", err);
    }
  })
};

/**
 * Adds a tag to the tag table.
 */
tags.addTagToTable = function(tag) {
  var tagsTable = document.getElementById('tags-table');
  var row = tagsTable.insertRow(tagsTable.rows.length);

  var typeElem = document.createElement('td');
  if (tag.automatic) {
    row.className = "bg-danger";
    typeElem.innerHTML = "Automatic"
  } else {
    typeElem.innerHTML = "Manual";
  }
  row.appendChild(typeElem);

  var animal = document.createElement('td');
  animal.innerHTML = tag.animal;
  row.appendChild(animal);

  var number = document.createElement('td');
  number.innerHTML = tag.number;
  row.appendChild(number);

  var event = document.createElement('td');
  event.innerHTML = tag.event;
  row.appendChild(event);

  var confidence = document.createElement('td');
  confidence.innerHTML = precisionRound(tag.confidence, 2);
  row.appendChild(confidence);

  var taggedby = document.createElement('td');
  taggedby.innerHTML = tag.taggerId;
  row.appendChild(taggedby);
  
  var tagtime = document.createElement('td');
  tagtime.innerHTML = new Date(tag.createdAt).toLocaleString();
  row.appendChild(tagtime);
  
  var age = document.createElement('td');
  age.innerHTML = tag.age;
  row.appendChild(age);

  var startTime = document.createElement('td');
  startTime.innerHTML = tag.startTime;
  row.appendChild(startTime);

  var duration = document.createElement('td');
  duration.innerHTML = tag.duration;
  row.appendChild(duration);

  var trapType = document.createElement('td');
  trapType.innerHTML = tag.trapType;
  row.appendChild(trapType);

  // Add delete button
  var del = document.createElement('td');
  var deleteButton = document.createElement('button');
  deleteButton.innerHTML = "Delete"
  deleteButton.onclick = tags.delete;
  deleteButton.tagId = tag.id;
  deleteButton.tagRow = row;
  del.appendChild(deleteButton)
  row.appendChild(del);
};
/**
 * Loads all the tags in the list given to the table.
 */
tags.load = function(loadingTags) {
  for (var i in loadingTags) {
    tags.addTagToTable(loadingTags[i]);
  }
};

/**
 * Create a new tag from the fields and sends tag to server.
 */
tags.new = function() {
  if (document.getElementById("tagForm").checkValidity() == false) {
    console.log("Form is invalid");
    return;
  }
  var tag = {};
  try {
    tag.animal = tags.parseSelect('tagAnimalInput');
    tag.number = tags.parseInt('tagNumberInput');
    tag.event = tags.parseSelect('tagEventInput')
    tag.confidence = tags.parseConfidence('tagConfidenceInput');
    tag.age = tags.parseAge('tagAgeInput');
    tag.startTime = tags.parseTime('tagStartTimeInput');
    tag.duration = tags.parseDuration(
      'tagStartTimeInput', 'tagStopTimeInput');
    tag.trapType = tags.parseSelect('tagTrapTypeInput');

    // save user tag defaults.
    user.setTagDefault('tagAnimalInput', tag.animal);
    user.setTagDefault('tagEventInput', tag.event);
    user.setTagDefault('tagTrapTypeInput', tag.trapType);
  } catch (err) {
    console.log(err);
    return;
  }
  tags.send(tag);
};

tags.send = function(tag) {
  var data = {recordingId: id};
  data.tag = JSON.stringify(tag);
  // Upload new tag
  $.ajax({
    url: api + '/api/v1/tags',
    type: 'POST',
    headers: { 'Authorization': user.getJWT() },
    data: data,
    success: function(res) {
      tag.id = res.tagId;
      tags.addTagToTable(tag);
    },
    error: function(err) {
      console.log("Error:", err);
    }
  })
}

/**
 * Parses a Select input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 */
tags.parseSelect = function(id) {
  return document.getElementById(id).value;
}

/**
 * Parses a Integer input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 */
tags.parseInt = function(id) {
  var i = parseInt(document.getElementById(id).value);
  if (isNaN(i)) i = null;
  return i;
}

/**
 * Parses a Age input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 */
tags.parseAge = function(id) {
  var ageString = document.getElementById(id).value;
  var ageYears = parseInt(ageString.split(':')[0]);
  var ageMonths = parseInt(ageString.split(':')[1]);
  var age = ageYears * 12 + ageMonths;
  if (isNaN(age)) age = null;
  return age
}

/**
 * Parses a Time input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 */
tags.parseTime = function(id) {
  var timeString = document.getElementById(id).value;
  var timeMin = parseInt(timeString.split(':')[0]);
  var timeSec = parseInt(timeString.split(':')[1]);
  var time = timeMin * 60 + timeSec;
  if (isNaN(time)) time = null;
  return time;
}

/**
 * Parses a Duration input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 * The duration is calculated as the secconds from the start time to end time.
 */
tags.parseDuration = function(startId, endId) {
  var endTime = tags.parseTime(endId)
  var startTime = tags.parseTime(startId)
  var duration = tags.parseTime(endId) - tags.parseTime(startId);
  if (endTime == null || startTime == null) return null
  if (duration <= 0) throw { message: "duration can't be negative" };
  return duration;
}

/**
 * Parses a String input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 */
tags.parseString = function(id) {
  var val = document.getElementById(id).value;
  if (val === "") val = null;
  return val;
}

/**
 * Parses a Confidence input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 */
tags.parseConfidence = function(id) {
  var val = $('input[name="' + id + '"]:checked').val();
  return val;
}

function precisionRound(number, precision) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}
