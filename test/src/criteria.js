"use strict";

const test = require("ava");
const Criteria = require("../../src/criteria");

test("add Filter without append", t => {

  const criteria = new Criteria("source");
  criteria.addFilter("name", {opt1: 1});

  t.deepEqual(criteria.filters, {name: {opt1: 1}});
});

test("add Filter with append option", t => {

  const criteria = new Criteria("source");
  criteria.addFilter("name", {opt1: 1}, true);
  criteria.addFilter("name", {opt1: 2}, true);

  t.deepEqual(criteria.filters, {name: [{opt1: 1}, {opt1: 2}]});
});
