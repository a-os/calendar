(function(window) {

  /**
   * Creates an abstract store instance.
   * Every store must contain a reference
   * to the database.
   */
  function Abstract(db) {
    this.db = db;
    this._cached = Object.create(null);
    Calendar.Responder.call(this);
  }

  Abstract.prototype = {
    __proto__: Calendar.Responder.prototype,

    _store: null,

    get cached() {
      return this._cached;
    },

    /**
     * Adds an account to the database.
     *
     * @param {Object} object reference to account object to store.
     * @param {IDBTransaction} trans transaction.
     * @param {Function} callback node style callback.
     */
    persist: function(object, trans, callback) {
      if (typeof(trans) === 'function') {
        callback = trans;
        trans = undefined;
      }

      if (typeof(trans) === 'undefined') {
        trans = this.db.transaction(
          this._store,
          'readwrite'
        );
      }

      var self = this;
      var store = trans.objectStore(this._store);
      var data = this._objectData(object);
      var id;

      var putReq;
      var reqType;

      if (object._id) {
        putReq = store.put(data, object._id);
        reqType = 'update';
      } else {
        reqType = 'add';
        putReq = store.put(data);
      }

      trans.addEventListener('error', function() {
        callback(err);
      });

      trans.addEventListener('complete', function(data) {
        var id = putReq.result;
        var result = self._createModel(object, id);

        self._cached[id] = result;
        callback(null, id, result);

        self.emit(reqType, id, result);
        self.emit('persist', id, result);
      });
    },

    /**
     * Removes a object from the store.
     *
     * @param {String} id record reference.
     * @param {IDBTransaction} trans transaction.
     * @param {Function} callback node style callback.
     */
    remove: function(id, trans, callback) {
      if (typeof(trans) === 'function') {
        callback = trans;
        trans = undefined;
      }

      if (typeof(trans) === 'undefined') {
        trans = this.db.transaction(
          this._store,
          'readwrite'
        );
      }

      var self = this;
      var store = trans.objectStore('accounts');

      var req = store.delete(parseInt(id));

      trans.addEventListener('error', function(event) {
        callback(event);
      });

      trans.addEventListener('complete', function() {
        delete self._cached[id];
        callback(null, id);
        self.emit('remove', id);
      });
    },

    _objectData: function(data) {
      if ('toJSON' in data) {
        return data.toJSON();
      }
      return data;
    }
  };

  Calendar.ns('Store').Abstract = Abstract;

}(this));
