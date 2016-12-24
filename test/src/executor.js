"use strict";

const Executor = require("../../src/executor");
const Adapter = require("../../src/adapter");

const test = require("ava");

test("Construct executor", t => {
  t.plan(2);

  const ex = new Executor({path: "/some/path/as/string"});

  t.true(Array.isArray(ex.opts.path));
  t.is(ex.opts.path[0], "/some/path/as/string");
});

test("pass Adapter instance into setAdapter", t => {
  t.plan(2);
  const ex = new Executor({path: []});

  let ad = new Adapter();
  ex.setAdapter(ad);
  t.true(ex.adapter === ad);
  t.pass();
});

test("pass right {} instance into setAdapter", t => {
  t.plan(2);
  const ex = new Executor({path: []});

  let ad = {
    getProvider() {

    },
    execute() {

    }
  };

  ex.setAdapter(ad);
  t.true(ad === ex.adapter);
  t.pass();
});

test("pass wrong {} instance into setAdapter", t => {
  t.plan(1);
  const ex = new Executor({path: []});
  t.throws(function () {
    ex.setAdapter({})
  });
});

test("resolveFilterPath returns right path for filter", t => {
  t.plan(1);
  const path = require("path");
  const ex = new Executor({path: path.join(process.cwd(), "test/fixtures") });
  const p = ex.resolveFilterPath("test");

  t.is(p, path.join(process.cwd(), "test/fixtures/test"));
});

test("resolveFilterPath throw an Error if filter not found", t => {
  t.plan(1);
  const path = require("path");
  const ex = new Executor({path: path.join(process.cwd(), "test/fixtures") });
  t.throws(function () {
    ex.resolveFilterPath("unknownFilter");
  });
});

test("resolveFilters returns initialized array of filter functions", t => {
  t.plan(3);
  const path = require("path");
  const ex = new Executor({path: path.join(process.cwd(), "test/fixtures")});
  const res = ex.resolveFilters({
    test: {}
  });

  t.true(Array.isArray(res));
  t.is(res.length, 1);
  t.true(typeof res[0] === "function");
});

test("resolveFilters return array of function even if filters were appended", t => {
  t.plan(2);
  const path = require("path");
  const ex = new Executor({path: path.join(process.cwd(), "test/fixtures")});
  const res = ex.resolveFilters({
    test: {},
    test2: [
      {opt1: 1},
      {opt1: 2}
    ]
  });

  t.true(Array.isArray(res));
  t.is(res.length, 3);
});

test("mapValues", t => {
  const path = require("path");

  const executor = new Executor({
    path: path.join(process.cwd(), "test/fixtures")
  });

  let res = executor.mapValues({a: 1, b: 2, c: 3}, {a: false});

  t.deepEqual(res, {b:2, c:3});
});
