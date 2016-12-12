"use strict";

const compose = require("koa-compose");
const path = require("path");
const {exists} = require("./utils");
const Adapter = require("./adapter");
const Criteria = require("./criteria");

/**
 * Main class which is responsible for proceeding of criteria execution.
 */
class Executor {

  /**
   * @param {string|string[]} path Array of folders where custom filters are located. String can be passed.
   */
  constructor({path = []}) {
    if (typeof path === "string") {
      path = [path];
    }
    this.opts = {
      path
    };
  }

  /**
   * @param {Adapter|{}} adapter
   * @throws
   */
  setAdapter(adapter) {
    if (adapter instanceof Adapter || ["getProvider", "execute"].every(fn => typeof adapter[fn] === "function")) {
      this.adapter = adapter;
      return;
    }
    throw new Error("You must pass valid adapter object.");
  }

  /**
   * Find filter's folder path
   *
   * @param {string} filter
   * @returns {string}
   * @throws
   */
  resolveFilterPath(filter) {
    let filterPath = this.opts.path.find(p => exists(path.join(p, `${filter}.js`)));
    if (typeof filterPath === "undefined") {
      throw new Error(`"${filter}" filter not found`);
    }
    return path.join(filterPath, filter);
  }

  /**
   * Normalize filters map passed from criteria. This method finds each implementation of passed filter and initializes
   * it. If filter was passed as function, that's mean that it is implementation itself.
   *
   * @param {{}} filtersMap
   * @returns {function[]}
   */
  resolveFilters(filtersMap) {
    return Object.keys(filtersMap)
      .map(name => {
        if (typeof name === "function") {
          return name;
        }
        let filterPath = this.resolveFilterPath(name);
        return require(filterPath)(filtersMap[name]);
      });
  }

  /**
   * Default very lightweight mapper
   *
   * @param {{}} obj
   * @param {{}} rules
   * @returns {{}}
   */
  mapValues(obj, rules = {}) {
    return Object.keys(obj)
      .reduce((result, key) => {
        if (rules.hasOwnProperty(key)) {
          if (rules[key] === false) {
            // if column is marked as `false` skip it
            return result;
          }
          if (typeof rules[key] === "function") {
            result[key] = rules[key](obj[key]);
            return result;
          }
          result[rules[key]] = obj[key];
        } else {
          // if rules doesn't contain property, use it with the same name
          result[key] = obj[key];
        }

        return result;
      }, {})
  }

  /**
   * Helper function to return first element of result
   *
   * @param {Criteria|{}} criteria
   */
  findOne(criteria) {
    return this.execute(criteria)
      .then(r => {
        if (Array.isArray(r)) {
          return r[0];
        }
        return r;
      });
  }

  /**
   * Build query by passed criteria and run it. Each filter can be defined as async await function or return Promise.
   *
   * @param {Criteria|{}} criteria
   */
  execute(criteria) {
    if (criteria instanceof Criteria || ["filters", "source", "mappers"].every(fn => fn in criteria)) {
      const filtersFn = this.resolveFilters(criteria.filters);
      const fn = compose(filtersFn);

      let provider = this.adapter.getProvider(criteria.source);

      return fn(provider)
        .then(() => {
          return this.adapter.execute(provider);
        })
        .then((results) => {
          if (!criteria.mappers.length) {
            return results;
          }
          // TODO: check if results is array
          return criteria.mappers.reduce((results, mapper) => {
            if (typeof mapper === "function") {
              // use custom mapper function that is provided with criteria
              return results.map(r => mapper(r));
            } else if (typeof mapper === "object" && !Array.isArray(mapper)) {
              // if mapper was passed as plain object try to map results like column -> field
              return results.map(r => this.mapValues(r, mapper))
            }
            return results;
          }, results);
        })
        .catch((err) => {
          console.error(err);
          throw err;
        });
    }
    throw new Error("You must pass valid criteria object.");
  }
}

module.exports = Executor;
