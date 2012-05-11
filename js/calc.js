(function(window) {
  if (typeof(Calendar) === 'undefined') {
    Calendar = {};
  }

  Calendar.Calc = {

    PAST: 'past',

    NEXT_MONTH: 'next-month',

    PRESENT: 'present',

    FUTURE: 'future',

    get today() {
      //TODO: implement cache
      return new Date();
    },

    isToday: function(date) {
      var today = this.today,
          month = date.getMonth() == today.getMonth(),
          day = date.getDate() == today.getDate(),
          year = date.getYear() == today.getYear();


      if (month && day && year) {
         return true;
      }

      return false;
    },

    /**
     * Returns an identifier for a specific
     * date in time for a given date
     *
     * @param {Date} date to get id for.
     * @return {String} identifier.
     */
    getDayId: function(date) {
      return [
        'd',
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ].join('-');
    },

    /**
     * Returns a date object from
     * a string id for a date.
     *
     * @param {String} id identifier for date.
     * @return {Date} date output.
     */
    dateFromId: function(id) {
      var parts = id.split('-'),
          date,
          type;

      if (parts.length > 1) {
        type = parts.shift();
        switch (type) {
          case 'd':
            date = new Date(parts[0], parts[1], parts[2]);
            break;
          case 'm':
            date = new Date(parts[0], parts[1]);
            break;
        }

        return date;
      }

      return false;
    },

    /**
     * Returns an identifier for a specific
     * month in time for a given date.
     *
     * @return {String} identifier.
     */
    getMonthId: function(date) {
      return [
        'm',
        date.getFullYear(),
        date.getMonth()
      ].join('-');
    },

    createDay: function(date, day, month, year) {
      day = day || 0;
      month = month || 0;
      year = year || 0;

      return new Date(
        year || date.getFullYear(),
        month || date.getMonth(),
        day || date.getDate()
      );
    },

    /**
     * Returns an array of weekdays
     * based on the start date.
     * Will always return the 7 days
     * of that week regardless of what the start date is
     * but they will be returned in the order
     * of their localized getDay function.
     *
     * @param {Date} startDate point of origin.
     * @return {Array} a list of dates in order of getDay().
     */
    getWeeksDays: function(startDate) {
      //local day position
      var currentDay = startDate.getDay(),
          startDay = startDate.getDate() - currentDay,
          weeksDayStart,
          weekDay,
          result = [],
          i = 1;


      //clone day
      weeksDayStart = this.createDay(startDate, startDay);
      result.push(weeksDayStart);

      for (; i < 7; i++) {
        result.push(new Date(
          weeksDayStart.getFullYear(),
          weeksDayStart.getMonth(),
          weeksDayStart.getDate() + i
        ));
      }

      return result;
    },

    /**
     * Checks if date is in the past
     *
     * @return {Boolean} true when date is in the past.
     */
    isPast: function(date, today) {
      today = today || this.today;
      return (date.valueOf() < today.valueOf());
    },

    /**
     * Checks if date is in the future
     *
     * @return {Boolean} true when date is in the future.
     */
    isFuture: function(value, today) {
      return !this.isPast(value, today);
    },

    /**
     * Based on the input date
     * will return one of the following states
     *
     *  past, present, future
     *
     * @param {Date} date for compare.
     * @param {Date} today today's date.
     * @return {String} state.
     */
    relativeState: function(date, today) {
      today = today || this.today;

      if (this.isToday(date, today)) {
        return this.PRESENT;
      }

      if (this.isPast(date, today)) {
        return this.PAST;
      }

      if (date.getMonth() != today.getMonth()) {
        return this.FUTURE + ' ' + this.NEXT_MONTH;
      }

      return this.FUTURE;
    }

  };

}(this));
