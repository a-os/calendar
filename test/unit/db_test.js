requireApp('calendar/test/unit/helper.js');
requireApp('calendar/js/responder.js');
requireApp('calendar/js/db.js');

requireApp('calendar/js/store/abstract.js');
requireApp('calendar/js/store/account.js');

suite('db', function() {
  var subject;
  var name;

  setup(function(done) {
    subject = testSupport.calendar.db();
    name = subject.name;
    subject.deleteDatabase(function(err, success) {
      assert.ok(!err, 'should not have an error when deleting db');
      assert.ok(success, 'should be able to delete the db');
      done();
    });
  });

  test('accounts', function() {
    var result = subject.accounts;

    assert.instanceOf(result, Calendar.Store.Account);
    assert.equal(result.db, subject);
  });

  test('initialization', function() {
    // create test db
    assert.equal(subject.name, name);
    assert.ok(subject.version);
    assert.ok(subject.store);

    assert.instanceOf(subject, Calendar.Responder);
    assert.isTrue(Object.isFrozen(subject.store));
  });

  test('#_openStore', function() {
    var Store = function(db) {
      this.db = db;
    }

    Store.prototype = {
      __proto__: Calendar.Store.Abstract.prototype,

      onopen: function() {
        this.open = true;
      }
    };
  });

  suite('#transaction', function() {

    setup(function(done) {
      subject.open(function() {
        done();
      });
    });

    test('result', function(done) {
      var trans = subject.transaction(['events'], 'readonly');

      assert.equal(trans.mode, 'readonly');

      trans.onabort = function() {
        done();
      }

      trans.abort();
    });

  });

  teardown(function() {
    subject.close();
  });

  suite('#open', function() {
    suite('on version change', function() {
      // db should be destroyed at this point

      test('creation of stores', function(done) {
        var finishedOpen = false;

        assert.ok(!subject.connection, 'connection should be closed');

        subject.on('open', function() {
          if (!finishedOpen) {
            done(new Error(
              'fired callback/event out of order ' +
              'callback should fire then events'
            ));
          } else {
            done(function() {
              // check that each store now exists
              var stores = subject.connection.objectStoreNames;
              var actualStore;
              for (actualStore in subject.store) {
                assert.ok(
                  (stores.contains(actualStore)),
                  actualStore + ' was not created'
                );
              }
            });
          }
        });

        subject.open(function() {
          assert.ok(subject.connection);
          assert.equal(subject.connection.name, name);
          finishedOpen = true;
        });
      });
    });

    suite('after version change', function() {

      setup(function(done) {
        // make sure db is open
        subject.open(function() {
          done();
        });
      });

      test('open', function(done) {
        // close it
        subject.close();
        subject = new Calendar.Db(subject.name);

        subject.open(function() {
          done();
        });
      });

    });

  });


});
