define(function(require) {
'use strict';

var MonthsDay = require('templates/months_day');

suite('templates/months_day', function() {
  function renderHTML(type, options) {
    return MonthsDay[type].render(options);
  }

  suite('#event', function() {
    test('> regular event', function() {
      var result = renderHTML('event', {
        classes: 'foo-class',
        busytimeId: 55,
        calendarId: 42,
        title: 'Lorem Ipsum',
        location: 'Dolor Sit Amet',
        attendees: null,
        startTime: new Date('October 13, 2014 12:34:00'),
        endTime: new Date('October 13, 2014 16:56:00'),
        isAllDay: false
      });

      assert.include(result, 'foo-class');
      assert.include(result, 'data-id="55"');
      assert.include(result, 'calendar-id-42');
      assert.include(result, 'Lorem Ipsum');
      assert.include(result, 'Dolor Sit Amet');
      assert.include(result, '12:34');
      assert.include(result, '16:56');
    });

    test('> all day event', function() {
      var result = renderHTML('event', {
        classes: 'foo-class',
        busytimeId: 55,
        calendarId: 42,
        title: 'Lorem Ipsum',
        location: 'Dolor Sit Amet',
        attendees: null,
        startTime: new Date('October 13, 2014 12:34:00'),
        endTime: new Date('October 13, 2014 16:56:00'),
        isAllDay: true
      });

      assert.include(result, 'foo-class');
      assert.include(result, 'data-id="55"');
      assert.include(result, 'calendar-id-42');
      assert.include(result, 'Lorem Ipsum');
      assert.include(result, 'Dolor Sit Amet');
      assert.include(result, 'data-l10n-id="hour-allday"');
      assert.ok(result.indexOf('12:34') === -1, 'include start time');
      assert.ok(result.indexOf('16:56') === -1, 'include end time');
    });
  });
});

});
