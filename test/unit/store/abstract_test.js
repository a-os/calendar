define(function(require, exports, module) {
'use strict';

var Abstract = require('store/abstract');
var Factory = require('test/support/factory');
var Responder = require('common/responder');
var core = require('core');

suite('store/abstract', function() {
  var subject;
  var db;

  setup(function(done) {
    db = core.db;
    subject = new Abstract(db);

    // set _store to accounts so we can actually
    // persist stuff.
    subject._store = 'accounts';

    db.open(function(err) {
      assert.ok(!err);
      done();
    });
  });

  teardown(function(done) {
    var trans = db.transaction(subject._store, 'readwrite');
    var accounts = trans.objectStore(subject._store);
    var res = accounts.clear();

    res.onerror = function() {
      done(new Error('could not wipe accounts db'));
    };

    res.onsuccess = function() {
      done();
    };
  });

  teardown(function() {
    db.close();
  });

  test('initialization', function() {
    assert.instanceOf(subject, Responder);
    assert.deepEqual(subject._cached, {});
  });

  suite('#get', function() {

    test('missing id', function(done) {
      subject.get('FOO_NOT_HERE', function(err, record) {
        done(function() {
          assert.ok(!err);
          assert.ok(!record);
        });
      });
    });

    suite('id present', function() {
      var record;

      setup(function(done) {
        record = Factory('account', { _id: 'foo' });
        subject.persist(record, done);
      });

      test('result', function(done) {
        subject.get(record._id, function(err, result) {
          done(function() {
            assert.hasProperties(
              record,
              result,
              'record matches persisted value'
            );
          });
        });
      });
    });

  });

  suite('#persist', function() {

    var events;
    var id;
    var object;
    var addDepsCalled;

    function watchEvent(event, done) {
      subject.once(event, function() {
        events[event] = arguments;
        if (typeof(done) === 'function') {
          done();
        }
      });
    }

    function checkEvent(event, id, object) {
      var list = events[event];

      assert.equal(list[0], id);
      assert.equal(list[1], object);
    }

    suiteSetup(function() {
      this.testData = {};
    });

    setup(function(done) {
      addDepsCalled = null;
      object = this.testData.object;
      events = {};

      subject._addDependents = function() {
        addDepsCalled = arguments;
      };

      if (this.testData.persist !== false) {
        subject.persist(object, function(err, key) {
          id = key;
        });

        watchEvent('add');
        watchEvent('update');
        watchEvent('persist', done);
      } else {
        done();
      }
    });

    suite('with transaction', function() {

      suiteSetup(function() {
        this.testData.persist = false;
      });

      suiteTeardown(function() {
        delete this.testData.persist;
      });

      test('result', function(done) {
        var trans;
        var obj = { name: 'foo' };
        var callbackFired = false;
        var transFired = false;
        var pending = 2;

        function next() {
          pending--;
          if (!pending) {
            complete();
          }
        }

        function complete() {
          done(function() {
            assert.isTrue(callbackFired);
            assert.isTrue(transFired);
          });
        }

        trans = core.db.transaction(
          subject._store,
          'readwrite'
        );

        trans.oncomplete = function() {
          transFired = true;
          next();
        };

        subject.persist(obj, trans, function() {
          callbackFired = true;
          next();
        });

      });

    });

    suite('update', function() {
      var id = 'uniq';

      suiteSetup(function() {
        this.testData.persist = true;
        this.testData.object = { providerType: 'local', _id: 'uniq' };
      });

      suiteTeardown(function() {
        delete this.testData.persist;
        delete this.testData.object;
      });

      test('update event', function() {
        checkEvent('update', id, object);
      });

      test('persist event', function() {
        checkEvent('persist', id, object);
      });

      test('db persistance', function(done) {
        subject.get(id, function(err, result) {
          if (err) {
            done(err);
            return;
          }

          done(function() {
            assert.equal(object._id, id);
            assert.equal(subject._cached[id], object);
            assert.deepEqual(result.providerType, object.providerType);
          });
        });
      });
    });

    suite('add', function() {
      suiteSetup(function() {
        this.testData.persist = true;
        this.testData.object = { providerType: 'local' };
      });

      suiteTeardown(function() {
        delete this.testData.persist;
        delete this.testData.object;
      });

      test('add event', function() {
        checkEvent('add', id, object);
      });

      test('persist event', function() {
        checkEvent('persist', id, object);
      });

      test('db persistance', function(done) {
        assert.equal(addDepsCalled[0], object);

        subject.get(id, function(err, result) {
          if (err) {
            done(err);
            return;
          }

          done(function() {
            assert.equal(object._id, id);
            assert.equal(subject._cached[id], object);
            assert.deepEqual(result.providerType, object.providerType);
          });
        });
      });
    });
  });

  suite('#remove', function() {
    var id;
    var removeEvent;
    var callbackCalled = false;
    var removeDepsCalled = false;

    setup(function(done) {
      subject.persist({ providerType: 'Local' }, function(err, key) {
        if (err) {
          done(new Error('could not add'));
        } else {
          id = key;
          done();
        }
      });
    });

    setup(function(done) {
      var preRemoveCalled = false;
      callbackCalled = false;
      removeDepsCalled = false;

      subject._removeDependents = function() {
        removeDepsCalled = arguments;
      };

      subject.once('preRemove', function(_id) {
        assert.equal(id, _id, 'same id');
        preRemoveCalled = true;
      });

      subject.remove(id, function() {
        callbackCalled = true;
      });

      assert.ok(preRemoveCalled, 'removes event');

      subject.once('remove', function() {
        removeEvent = arguments;
        // wait until next tick so other events
        // have finished firing...
        setTimeout(function() {
          done();
        }, 0);
      });
    });

    test('event', function() {
      assert.equal(removeEvent[0], id);
    });

    test('remove', function() {
      assert.ok(callbackCalled);
      assert.equal(removeDepsCalled[0], id);
      assert.instanceOf(removeDepsCalled[1], IDBTransaction);

      assert.ok(!subject._cached[id], 'should remove cached account');
    });
  });

  suite('#count', function() {
    setup(function(done) {
      var trans = core.db.transaction(
        subject._store,
        'readwrite'
      );

      trans.oncomplete = function() {
        done();
      };

      subject.persist(Factory('account'), trans);
      subject.persist(Factory('account'), trans);
    });

    test('result', function(done) {
      subject.count(function(err, number) {
        done(function() {
          assert.equal(number, 2);
        });
      });
    });
  });

  suite('#all', function() {
    var ids = [];

    setup(function() {
      ids.length = 0;
    });

    function add() {
      setup(function(done) {
        subject.persist({ providerType: 'Local' }, function(err, id) {
          ids.push(id.toString());

          done();
        });
      });
    }

    add();
    add();

    test('multiple all calls in parallel', function(done) {
      var expected = 3;
      var pending = expected;
      var results = [];

      function complete() {
        assert.lengthOf(results, expected);

        var idx = 1;

        for (; idx < expected; idx++) {
          for (var key in results[idx]) {
            assert.equal(
              results[0][key],
              results[idx][key],
              'objects are equal: ' + key
            );
          }
        }
      }

      function next(err, list) {
        if (err) {
          return done(err);
        }

        var obj = Object.create(null);

        for (var key in list) {
          obj[key] = list[key];
        }

        results.push(obj);

        if (!--pending) {
          done(complete);
        }
      }

      // load in parallel
      subject.all(next);
      subject.all(next);
      subject.all(next);
    });

    test('results', function(done) {
      var result;

      function verify() {
        var keys = Object.keys(result);
        var key;

        assert.deepEqual(
          keys.sort(),
          ids.sort()
        );

        for (key in result) {
          var obj = result[key];

          assert.ok(subject._cached[key]);
          assert.ok(obj._id);
          assert.equal(obj.providerType, 'Local');
        }
      }

      subject.all(function(err, data) {
        if (err) {
          done(err);
        }

        result = data;
        done(verify);
      });
    });
  });

  suite('#_objectData', function() {
    test('with toJSON', function() {
      var obj = {};
      obj.toJSON = function() {
        return 'foo';
      };

      assert.equal(subject._objectData(obj), 'foo');
    });

    test('without toJSON', function() {
      var obj = Object.create(null);
      obj.foo = '1';

      assert.equal(subject._objectData(obj), obj);
    });

  });
});

});
