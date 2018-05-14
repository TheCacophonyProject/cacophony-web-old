'use strict';

const timeUtil = {
  unitsMap: null,
};

timeUtil.unitsMap = {
  s: ['s', 'sec', 'secs', 'second', 'seconds'],
  m: ['m', 'min', 'mins', 'minute', 'minutes'],
  h: ['h', 'hr', 'hrs', 'hour', 'hours'],
};

timeUtil.unitValues = {
  s: 1,
  m: 60,
  h: 3600
};

/**
 * Parse a timestring
 *
 * @param  {String} string
 * @param  {Object} opts
 * @return {Number}
 */

timeUtil.parseTimeToSeconds = function (timeString) {
  let totalSeconds = 0;
  let groups = timeString.toLowerCase().match(/[0-9]+ ?[a-z]+/g);

  if (groups !== null) {
    groups.forEach(group => {
      let value = group.match(/[0-9]+/g)[0];
      let unit = group.match(/[a-z]+/g)[0];

      totalSeconds += timeUtil.getSeconds(value, unit);
    });
  }
  return totalSeconds;
};

/**
 * Get the key for a unit
 *
 * @param   {String} unit
 * @returns {String}
 */

timeUtil.getUnitKey = function(unit) {
  for (let key of Object.keys(timeUtil.unitsMap)) {
    if (timeUtil.unitsMap[key].indexOf(unit) > -1) {
      return key;
    }
  }
  return null;
};

/**
 *  Get the number of seconds for a value, based on the unit
 *
 * @param   {Number} value
 * @param   {String} unit
 * @param   {Object} unitValues
 * @returns {Number}
 */

timeUtil.getSeconds = function(value, unit) {
  let unitValue = timeUtil.unitValues[timeUtil.getUnitKey(unit)];

  if (value && unit) {
    return value * unitValue;
  }

  return 0;
};

timeUtil.secondsToReadableTime = function(totalSecs) {
  let timeString = "";

  let units = ["sec", "min", "hour"];
  let timeLeft = totalSecs;
  for (let i in units) {
    let count = timeLeft % 60;
    timeLeft = (timeLeft - count) / 60;
    timeString = timeUtil.addToPrintedTime(timeString, count, units[i]);
    console.log(timeString);
  }

  return timeString;
};

timeUtil.addToPrintedTime = function(timeString, value, unit) {
  if (value > 1) {
    unit = unit + "s";
  }

  if (value > 0) {
    let newString = value + " "  + unit;
    if (timeString === "") {
      return newString;
    }
    return newString + " " + timeString;
  }
  return timeString;
};