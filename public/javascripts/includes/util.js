
var util = {
  customType : {},
};

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

util.splitInputNameIntoKeysArray = function(element) {
  let name = $(element).attr("name").split(':')[0]; //remove the type which comes after the :

  name = name.replace(/\]/g, '');
  var keys = name.split('[');
  if (keys[0] === '') {
    keys.shift(); // ensure no opening bracket ("[foo][inn]" should be same as "foo[inn]")
  }
  return keys;
};

util.getValueTypeFromName = function (element) {
  let name = $(element).attr("name");
  let keys = name.split(':');

  if (keys.length == 2) {
    return keys[1];
  }
  return null;
};

util.createNewAndPopulate = function(template, values) {
  const parent = $(template).children().first().clone();
  if (values) {
    util.populateElements(parent, values);
  }
  util.addOnChangeParsing(parent);
  return parent;
}

util.populateElements = function(parent, values) {
  parent.find("[name]").each(function() {
    var names = util.splitInputNameIntoKeysArray(this);
    if (names.length === 1 ) {
      if (values[names[0]]) {
        util.setValue($(this), values[names[0]]);
      }
    }
  });
};

util.createNewAndPopulateFromArray = function(template, values, arrayPosition) {
  const parent = $(template).children().first().clone();
  if (values) {
    util.populateFromArray(parent, values, arrayPosition);
  }
  util.addOnChangeParsing(parent);
  return parent;
}

util.populateFromArray = function(parent, values, counter) {
  parent.find("[name]").each(function() {
    var names = util.splitInputNameIntoKeysArray(this);
    if (names.length === 2 && names[1] === "" ) {
      var fieldname = names[0];
      if (values[fieldname] && values[fieldname].length > counter) {
        util.setValue(this, values[fieldname][counter]);
      }
    }
  });
};

util.addOnChangeParsing = function(parent) {
  parent.find("[name]").each(function() {
    let element = $(this);
    let valueType = util.getValueTypeFromName(element);
    let typeParser = util.customType[valueType];
    if (valueType && typeParser) {
      element.change(function(event) {
        // parse the string and convert back
        $(event.target).val(typeParser.display(typeParser.store($(event.target).val())));
      });
    }
  });
};

util.addCustomTypeParser = function(type, toStoreFunction, toDisplayFunction = util.noParseNeeded) {
  util.customType[type] = {
    store : toStoreFunction,
    display: toDisplayFunction
  };
};

util.noParseNeeded = function(value) {
  return value;
};

util.setValue = function(element, value) {
  let valueType = util.getValueTypeFromName(element);

  element = $(element);
  if (valueType && util.customType[valueType]) {
    value = util.customType[valueType].display(value);
  }

  if (element.prop("tagName") === "SELECT") {
    element.find('option[value="' + value + '"]').prop("selected", true);
  }
  else {
    element.val(value);
  }
};

