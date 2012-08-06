requireApp('calendar/test/unit/helper.js', function() {
  requireLib('timespan.js');
});

suite('timespan', function() {

  var subject;
  var startDate;
  var endDate;

  setup(function() {
    startDate = new Date(2012, 1, 1);
    endDate = new Date(2012, 12, 1);

    subject = new Calendar.Timespan(
      startDate,
      endDate
    );
  });

  test('initializer', function() {
    assert.equal(
      subject.start,
      startDate.valueOf()
    );

    assert.equal(
      subject.end,
      endDate.valueOf()
    );
  });

  suite('#contains', function() {
    var dates;

    suiteSetup(function() {
      dates = {
        'day of': {
          assert: true,
          value: new Date(2012, 1, 1)
        },

        'one day after': {
          assert: true,
          value: new Date(2012, 1, 2)
        },

        'day of end range': {
          assert: true,
          value: new Date(2012, 12, 1)
        },

        'day before range': {
          assert: false,
          value: new Date(2011, 12, 31)
        },

        'day after range': {
          assert: false,
          value: new Date(2012, 12, 2)
        }
      };
    });

    test('timespan in range', function() {
      var span = new Calendar.Timespan(
        new Date(2012, 1, 1),
        new Date(2012, 1, 5)
      );

      assert.isTrue(
        subject.contains(span)
      );

      assert.isFalse(
        span.contains(subject)
      );
    });

    function testWith(method, useNumeric) {
      var key;
      var prefix = '';

      if (useNumeric) {
        prefix += '[numeric] ';
      }

      prefix += method;

      for (key in dates) {
        if (dates.hasOwnProperty(key)) {
          var value = dates[key].value.valueOf();

          if (useNumeric) {
            value = value.valueOf();
          }

          assert.equal(
            subject.contains(value),
            dates[key].assert,
            prefix + key
          );
        }
      }
    }

    test('numeric (contains)', function() {
      testWith('contains', true);
    });

    test('numeric (containsNumeric)', function() {
      testWith('containsNumeric', true);
    });

    test('date', function() {
      testWith('contains', false);
    });
  });

});