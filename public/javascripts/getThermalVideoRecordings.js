function getTableData() {
  return [{
      tableName: "Video Pair",
      datapointField: "datapoint",
      parseFunction: parseVideoPair
    },
    {
      tableName: "ID",
      datapointField: "id",
      parseFunction: queryUtil.parseNumber
    },
    {
      tableName: "Group",
      datapointField: "group",
      parseFunction: queryUtil.parseGroup
    },
    {
      tableName: "Device ID",
      datapointField: "deviceId",
      parseFunction: queryUtil.parseNumber
    },
    {
      tableName: "Location",
      datapointField: "location",
      parseFunction: queryUtil.parseLocation
    },
    {
      tableName: "Time",
      datapointField: "recordingTime",
      parseFunction: queryUtil.parseTimeOnly
    },
    {
      tableName: "Date",
      datapointField: "recordingDateTime",
      parseFunction: queryUtil.parseDateOnly
    },
    {
      tableName: "Duration",
      datapointField: "duration",
      parseFunction: queryUtil.parseDuration
    },
    {
      tableName: "BatteryLevel",
      datapointField: "batteryLevel",
      parseFunction: queryUtil.parseNumber
    },
    {
      tableName: "BatteryCharging",
      datapointField: "batteryCharging",
      parseFunction: queryUtil.parseString,
    },
    {
      tableName: "AirplaneMode",
      datapointField: "airplaneModeOn",
      parseFunction: queryUtil.parseBoolean,
    },
    {
      tableName: "File",
      datapointField: "id",
      parseFunction: queryUtil.parseDownload
    }
  ];
}

function parseVideoPair(datapoint) {
  var link = document.createElement("a");
  var url = '/view_ir_and_thermal/'+datapoint.irVideoId+'/'+datapoint.id;
  link.setAttribute('href', url);
  link.setAttribute('target', '_blank');
  link.innerHTML = 'Video Pair';
  var td = document.createElement("td");
  td.appendChild(link);
  return td;
}

var recordingApiUrl = api + "/api/v1/thermalVideoRecordings";
var viewUrl = '/view_thermal_video_recording/';
