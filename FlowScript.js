
var status = input['Status'];
var priority = input['Priority'];
var propertyName = input['Property Name'];
var propertyValue = input['Property Value'];
var property2Name = input['Property 2 Name'];
var property2Value = input['Property 2 Value'];
var planName = input['Plan Name'];
var formName = input['Form Name'];
var isPropValExactMatch = input['Exact Property Value Match'];

if (isPropValExactMatch) {
  var isString = typeof isPropValExactMatch === 'string';
  if (isString && isPropValExactMatch.toUpperCase() === 'TRUE') {
    isPropValExactMatch = true;
  } else if (isString && isPropValExactMatch.toUpperCase() === 'FALSE') {
    isPropValExactMatch = false;
  } else {
    throw new Error('Exact Property Value Match input must be: \'TRUE\' or \'FALSE\'.');
  }
}

var LABEL_EVENT_IDS = 'Event IDs';
var LABEL_NUMBER_OF_EVENT_IDS_RETURNED = 'Number of Event IDs Returned';
var LABEL_TOTAL_EVENT_COUNT = 'Total Event Count';

if (!status && !priority && !propertyName) {
  throw new Error('At least one of the following must be set: Status, Priority, or Property Name.');
} else {

  var queryString = '?limit=50';
  if (planName) {
    queryString += '&plan=' + encodeURIComponent(planName);
  }
  if (formName) {
    queryString += '&form=' + encodeURIComponent(formName);
  }
  if (status) {
    queryString += '&status=' + status.replace(/\s/g, '').toUpperCase();
  }
  if (priority) {
    queryString += '&priority=' + priority.replace(/\s/g, '').toUpperCase();
  }
  if (propertyName) {
    queryString += '&propertyName=' + encodeURIComponent(propertyName) +
      ',' + encodeURIComponent(property2Name) +
      '&propertyValue=' + (propertyValue ? encodeURIComponent(propertyValue) : '') +
      ',' + (property2Value ? encodeURIComponent(property2Value) : '') +
      '&propertyValueOperator=' + (isPropValExactMatch ? 'EQUALS' : 'CONTAINS');
  }

  var getEventsRequest = http.request({
    endpoint: 'xMatters',
    method: 'GET',
    path: '/api/xm/1/events' + queryString
  });

  var response = getEventsRequest.write();
  var respBody;
  var cannotParseMsg = 'Unable to parse response body: ';

  if (response.statusCode >= 200 && response.statusCode < 300) {
    try {
      respBody = JSON.parse(response.body);
    } catch (e) {
      throw new Error(cannotParseMsg + response.body);
    }
    if (respBody) {
      var eventIds = [];

      var eventData = respBody.data;
      if (eventData && Array.isArray(eventData)) {
        for (var i = 0; i < eventData.length; i++) {
          eventIds.push(eventData[i].eventId);
        }
      }

      output[LABEL_EVENT_IDS] = eventIds.join(',');
      output[LABEL_NUMBER_OF_EVENT_IDS_RETURNED] = respBody.count;
      output[LABEL_TOTAL_EVENT_COUNT] = respBody.total;
    }
  } else {
    var error;
    var parseableRespBody = true;
    try {
      respBody = JSON.parse(response.body);
      error = respBody.message;
    } catch (e) {
      parseableRespBody = false;
      error = cannotParseMsg + response.body;
    }
    throw new Error(
      'Could not get Event IDs. '
      + (parseableRespBody ? 'xMatters API returned ' : '')
      + '[' + response.statusCode + '] '
      + (parseableRespBody ? 'and the following messages: ' : '')
      + error
    );
  }
}

  