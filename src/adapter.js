"use strict";

/**
 * Base adapter class to declare core method that should be exist in each adapter.
 * It is not obligatory to be extended from the class, but each method must be implemented in the target adapter.
 *
 * @abstract
 */
class Adapter {

  /**
   * Return **mutable** query builder instance, that will be transmitted into each filter
   *
   * @param {string|*} source
   */
  getProvider(source) {
    throw new Error("Must be implemented");
  }

  /**
   * Execute query by passing provider instance that was passed direct all filters
   *
   * @param {*} provider
   */
  execute(provider) {
    throw new Error("Must be implemented");
  }
}

module.exports = Adapter;
