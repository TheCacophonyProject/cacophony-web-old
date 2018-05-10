
var util = {};

util.addOptionElement = function(parent, text, hiddenId) {
  var option = document.createElement("option");
  option.innerText = text;
  option.setAttribute("value", hiddenId);
  parent.appendChild(option);
}

util.appendNameTag = function(parent, appendString) {
  parent.find("[name]").attr("name", function( i, val ) {
    return appendString + val;
  });
}

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
}