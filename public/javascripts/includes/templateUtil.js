
var templateUtil = {
  customType : {},
};

templateUtil.addOptionElement = function(parent, text, hiddenId) {
  var option = document.createElement("option");
  option.innerText = text;
  option.setAttribute("value", hiddenId);
  parent.appendChild(option);
};

templateUtil.appendNameTag = function(parent, appendString) {
  parent.find("[name]").attr("name", function( i, val ) {
    return appendString + val;
  });
};

templateUtil.combineElementsStartingWith = function(map, name) {
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

templateUtil.splitInputNameIntoKeysArray = function(element) {
  let name = $(element).attr("name").split(':')[0]; //remove the type which comes after the :

  name = name.replace(/\]/g, '');
  var keys = name.split('[');
  if (keys[0] === '') {
    keys.shift(); // ensure no opening bracket ("[foo][inn]" should be same as "foo[inn]")
  }
  return keys;
};

templateUtil.getValueTypeFromName = function (element) {
  let name = $(element).attr("name");
  let keys = name.split(':');

  if (keys.length == 2) {
    return keys[1];
  }
  return null;
};

templateUtil.createNewAndPopulate = function(template, values) {
  const parent = $(template).children().first().clone();
  return templateUtil.populateElements(parent, values);
};

templateUtil.populateElements = function(parent, values) {
  templateUtil.addOnChangeParsing(parent);
  if (values) {
    parent.find("[name]").each(function() {
      var names = templateUtil.splitInputNameIntoKeysArray(this);
      if (names.length === 1 ) {
        if (names[0] in values) {
          templateUtil.setValue($(this), values[names[0]]);
        }
      }
    });
  }
  return parent;
};

templateUtil.createNewAndPopulateFromArray = function(template, values, arrayPosition) {
  const parent = $(template).children().first().clone();
  return templateUtil.populateFromArray(parent, values, arrayPosition);
};

templateUtil.populateFromArray = function(parent, values, counter) {
  if (values) {
    parent.find("[name]").each(function() {
      var names = templateUtil.splitInputNameIntoKeysArray(this);
      if (names.length === 2 && names[1] === "" ) {
        var fieldname = names[0];
        if (fieldname in values && values[fieldname].length > counter) {
          templateUtil.setValue(this, values[fieldname][counter]);
        }
      }
    });
  }
  templateUtil.addOnChangeParsing(parent);
  return parent;
};

templateUtil.addOnChangeParsing = function(parent) {
  parent.find("[name]").each(function() {
    let element = $(this);
    let valueType = templateUtil.getValueTypeFromName(element);
    let typeParser = templateUtil.customType[valueType];
    if (valueType && typeParser) {
      element.change(function(event) {
        // parse the string and convert back
        $(event.target).val(typeParser.display(typeParser.store($(event.target).val())));
      });
    }
  });
};

templateUtil.addCustomTypeParser = function(type, toStoreFunction, toDisplayFunction = templateUtil.noParseNeeded) {
  templateUtil.customType[type] = {
    store : toStoreFunction,
    display: toDisplayFunction
  };
};

templateUtil.noParseNeeded = function(value) {
  return value;
};

templateUtil.setValue = function(element, value) {
  let valueType = templateUtil.getValueTypeFromName(element);

  element = $(element);
  if (valueType && templateUtil.customType[valueType]) {
    value = templateUtil.customType[valueType].display(value);
  }

  if (element.prop("tagName") === "SELECT") {
    element.find('option[value="' + value + '"]').prop("selected", true);
  }
  else {
    element.val(value);
  }
};

