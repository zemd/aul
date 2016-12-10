"use strict";

/**
 * Criteria helper class. Basically criteria object must provide `source` string, mappers array and `filters` map.
 * Everything else is not important, but it is easier to test Criteria objects if the inherit from base class.
 *
 * {
 *  source: "",
 *  filters: {
 *    name: {...opts}
 *  },
 *  mappers: []
 * }
 */
class Criteria {

  /**
   * @param {string} source
   */
  constructor(source) {
    this._source = source;
    this._filters = {};
    this._mappers = [];
  }

  /**
   * @param {string} name
   * @param {{}} opts
   */
  addFilter(name, opts) {
    this._filters[name] = opts;
  }

  /**
   * @param {function|{}} mapper
   */
  addMapper(mapper) {
    this._mappers.push(mapper);
  }

  /**
   * @returns {{}}
   */
  get filters() {
    return this._filters;
  }

  /**
   * @returns {string}
   */
  get source() {
    return this._source;
  }

  /**
   * @returns {{}[]|function[]}
   */
  get mappers() {
    return this._mappers;
  }
}

module.exports = Criteria;
