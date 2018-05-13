
var util = {};

util.addOptionElement = function(parent, text, hiddenId) {
  var option = document.createElement("option");
  option.innerText = text;
  option.setAttribute("value", hiddenId);
  parent.appendChild(option);
};

util.appendNameTag = function(parent, appendString) {
  parent.find("[name]").attr("name", function( i, val ) {
    return appendString + val;
  });
};

util.combineElementsStartingWith = function(map, name) {
  var list = [];
  Object.keys(map).forEach(function(key) {
    if (key.startsWith(name)) {
      list.push(map[key]);
      delete map[key];
    }
  });
  map[name + "s"] = list;
  return map;
};

util.splitInputNameIntoKeysArray = function(name) {
  name = name.replace(/\]/g, '');
  var keys = name.split('[');
  if (keys[0] === '') {
    keys.shift(); // ensure no opening bracket ("[foo][inn]" should be same as "foo[inn]")
  }
  return keys;
};

util.populateElements = function(parent, values) {
  parent.find("[name]").each(function() {
    var names = util.splitInputNameIntoKeysArray($(this).attr("name"));
    if (names.length === 1 ) {
      if (values[names[0]]) {
        util.setValue($(this), values[names[0]]);
      }
    }
  });
};

util.populateFromNthElements = function(parent, values, counter) {
  parent.find("[name]").each(function() {
    var names = util.splitInputNameIntoKeysArray($(this).attr("name"));
    if (names.length === 2 && names[1] === "" ) {
      var fieldname = names[0];
      if (values[fieldname] && values[fieldname].length > counter) {
        util.setValue($(this), values[fieldname][counter]);
      }
    }
  });
};

util.setValue = function(element, value) {
  if (element.prop("tagName") === "SELECT") {
    element.find('option[value="' + value + '"]').prop("selected", true);
  }
  else {
    element.attr("value", value);
  }
};

