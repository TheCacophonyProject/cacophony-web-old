/*
Contains the tagging functions (delete, load, new).
*/

/* global api, user, id */
/* exported toggleTaggingDetails */

const tags = {};

/**
 * Deletes a tag.
 */
tags.delete = function(event) {
  var id = event.target.parentNode.tagId;
  $.ajax({
    url: api+'/api/v1/tags',
    type: 'DELETE',
    headers: { 'Authorization': user.getJWT() },
    data: { "tagId": id },
    success: function() {
      var row = event.target.parentNode.parentNode.parentNode;
      row.parentNode.removeChild(row);
    },
    error: function(err) {
      console.log("Error with deleting tag:", err);
    }
  });
};

/**
 * Adds a tag to the tag table.
 */
tags.addTagToTable = function(tag) {
  var tagsTable = document.getElementById('tags-table');
  var row = tagsTable.insertRow(tagsTable.rows.length);

  var animal = document.createElement('td');
  if (tag.animal) {
    animal.innerHTML = tag.animal;
  } else {
    animal.innerHTML = "-";
  }

  row.appendChild(animal);

  var animalpic = document.createElement('td');
  var image = this.getAnimalImage(tag.animal, tag.event);
  if (image) {
    animalpic.innerHTML = "<img class='animal-icon' title='animal' src='" + image + "'/>";
  }
  row.appendChild(animalpic);

  var confidence = document.createElement('td');
  confidence.innerHTML = precisionRound(tag.confidence, 2);
  row.appendChild(confidence);

  var taggedby = document.createElement('td');
  if (tag.automatic) {
    row.className = "bg-danger";
    taggedby.innerHTML = "<img title='Cacophony AI' src='/images/auto.png'/>";
  } else if (tag.taggedbyme) {
    taggedby.innerHTML = "Me!";
  } else {
    taggedby.innerHTML = tag.taggerId;
  }
  row.appendChild(taggedby);

  var tagtime = document.createElement('td');
  tagtime.innerHTML = new Date(tag.createdAt).toLocaleString();
  row.appendChild(tagtime);
  
  var additionalInfo = document.createElement('td');
  row.appendChild(additionalInfo);

  // Add delete button
  var del = document.createElement('td');
  var deleteButton = document.createElement('button');
  deleteButton.innerHTML = "<img title='Delete sighting' src='/images/delete.png'/>";
  deleteButton.onclick = tags.delete;
  deleteButton.tagId = tag.id;
  deleteButton.tagRow = row;
  del.appendChild(deleteButton);
  row.appendChild(del);

  // Add a confirm button if tag created by Cacophony AI
  var confirm = document.createElement('td');
  console.log(tag);
  if (tag.automatic  && tag.animal !== "unidentified") {
    var confirmButton = document.createElement('button');
    confirmButton.innerHTML = "<i class='fas fa-check-circle fa-3x text-secondary'></i>";
    confirmButton.onclick = tags.confirm;
    confirmButton.tagId = tag.id;
    confirmButton.tagRow = row;
    confirm.appendChild(confirmButton);
  }
  row.appendChild(confirm);


  if (tag.number != null && tag.number > 1.5) {
    additionalInfo.innerHTML += "<p> Number of animals is '" + tag.number + "'</p>";
  }

  if (tag.event != null && tag.event != "just wandering about") {
    additionalInfo.innerHTML += "<p> Event is '<i>" + tag.event + "'</i></p>";
  }

  if (tag.trapType != null && tag.trapType != "") {
    additionalInfo.innerHTML += "<p> Trap type is '<i>" + tag.trapType + "'</i></p>";
  }

  if (tag.age != null && tag.age != "") {
    additionalInfo.innerHTML += "<p> Age is " + tag.age + "</p>";
  }

  if (tag.startTime != null || tag.duration != null) {
    if (tag.startTime == null) {
      tag.startTime == 0;
    }
    var timestring = "<p>Animal visible from " + tags.displayTime(tag.startTime);
    if (tag.duration != null) {
      timestring += "&nbsp;-&nbsp;" + tags.displayTime(tag.startTime + tag.duration);
    }
    timestring += "</p>";
    additionalInfo.innerHTML += timestring;
  }
};

/**
 * Gets the image that represents the animal (string) if available else returns null.
 */
tags.getAnimalImage = function(animal, event) {
  if (!animal && event == 'false positive') {
    return '/images/none.png';
  }

  switch(animal) {
  case "possum":
    return '/images/possum.png';
  case "stoat":
    return '/images/stoat.png';
  case "rat":
    return '/images/rat.png';
  case "hedgehog":
    return '/images/hedgehog.png';
  case "cat":
    return '/images/cat.png';
  case "human":
    return '/images/human.png';
  case "bird":
    return '/images/bird.png';
  case "bird/kiwi":
    return '/images/kiwi.png';
  case "unidentified":
    return '/images/unknown.png';
  default:
    return null;
  }
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
    tag.event = tags.parseSelect('tagEventInput');
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

tags.quickNew = function(animal) {
  var tag = {};

  tag.animal = animal;
  tag.confidence = .6;

  tags.send(tag);
};

tags.confirm = function(tag) {
  let tr = tag.target.parentNode.parentNode.parentNode;
  let animal = tr.children[0].innerText;
  if (animal === "-") {
    // false positive
    let tag = {};
    tag.event = "false positive";
    tag.confidence = 0.6;
    console.log(tags.parseSelect('tagEventInput'));
    tags.send(tag);
  } else {
    tags.quickNew(animal);
  }
  tag.target.classList.replace('text-secondary', 'text-success');
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
      tag.createdAt = new Date();
      tag.taggedbyme = true;
      tags.addTagToTable(tag);
    },
    error: function(err) {
      console.log("Error:", err);
    }
  });
};

/**
 * Parses a Select input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 */
tags.parseSelect = function(id) {
  return document.getElementById(id).value;
};

/**
 * Parses a Integer input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 */
tags.parseInt = function(id) {
  var i = parseInt(document.getElementById(id).value);
  if (isNaN(i)) {
    i = null;
  }
  return i;
};

/**
 * Parses a Age input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 */
tags.parseAge = function(id) {
  var ageString = document.getElementById(id).value;
  var ageYears = parseInt(ageString.split(':')[0]);
  var ageMonths = parseInt(ageString.split(':')[1]);
  var age = ageYears * 12 + ageMonths;
  if (isNaN(age)) {
    age = null;
  }
  return age;
};

/**
 * Parses a Time input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 */
tags.parseTime = function(id) {
  var timeString = document.getElementById(id).value;
  var timeMin = parseInt(timeString.split(':')[0]);
  var timeSec = parseInt(timeString.split(':')[1]);
  var time = timeMin * 60 + timeSec;
  if (isNaN(time)) {
    time = null;
  }
  return time;
};

/**
 * Takes time in total seconds and parses it back into minutes and seconds format.
 */
tags.displayTime = function(timeInSeconds) {
  var timeString = "";
  var seconds = (timeInSeconds % 60);

  timeString += ((timeInSeconds - seconds) / 60);
  timeString += ":";
  timeString += (seconds);
  return timeString;
};

/**
 * Parses a Duration input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 * The duration is calculated as the secconds from the start time to end time.
 */
tags.parseDuration = function(startId, endId) {
  var endTime = tags.parseTime(endId);
  var startTime = tags.parseTime(startId);
  var duration = tags.parseTime(endId) - tags.parseTime(startId);
  if (endTime == null || startTime == null) {
    return null;
  }
  if (duration <= 0) {
    throw { message: "duration can't be negative" };
  }
  return duration;
};

/**
 * Parses a String input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 */
tags.parseString = function(id) {
  var val = document.getElementById(id).value;
  if (val === "") {
    val = null;
  }
  return val;
};

/**
 * Parses a Confidence input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 */
tags.parseConfidence = function(id) {
  var val = $('input[name="' + id + '"]:checked').val();
  return val;
};

function precisionRound(number, precision) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}


function toggleTaggingDetails() {
  var tagformClasses = document.getElementById('detailedAddTagForm').classList;

  if (tagformClasses.contains('hidden')) {
    tagformClasses.remove('hidden');
  } else {
    tagformClasses.add('hidden');
  }
}
