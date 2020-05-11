const { expect } = require('chai');

const Plan = require('../../lib/Plan.js');
const JourneyContext = require('../../lib/JourneyContext.js');

const ITERATIONS = 10000;

const results = [];

function ms(start, end) {
  return parseInt((end - start) / 1000000n, 10);
}

function makeWaypoints(wpCount) {
  const makeWpName = (i) => {
    return `${String.fromCharCode((i % 26) + 97)}${String.fromCharCode((i + 1) % 26 + 97)}${String.fromCharCode((i + 2) % 26 + 97)}${Math.round(Math.random() * 1000000)}`;
  }

  return (new Array(wpCount)).fill('').map((e, i) => makeWpName(i));
}

// Make a Plan that has a context that wil allow traversal all the way to the end
function makePlanWithSeededContext({ waypoints, condition = undefined }) {
  const plan = new Plan();
  plan.addOrigin('main', waypoints[0]);
  for (let i = 1; i < waypoints.length; i ++) {
    plan.setRoute(waypoints[i - 1], waypoints[i], condition);
  }
  // plan.addSequence.apply(plan, waypoints);

  const data = {};
  const validation = {};
  waypoints.forEach(wp => {
    data[wp] = {};
    validation[wp] = null;
  });
  const context = new JourneyContext(data, validation);

  return { plan, context };
}

function addResult(testName, duration) {
  results.push({
    testName,
    duration,
  });
}

/* -------------------------------------------------------------------- tests */

function testTraversalSimpleShortPlan() {
  const { plan, context } = makePlanWithSeededContext({ waypoints: makeWaypoints(4) });

  const s = process.hrtime.bigint();
  for (let i = ITERATIONS; i > 0; i --) {
    plan.traverseRoutes(context, { routeName: 'next' });
  }
  const e = process.hrtime.bigint();

  addResult('Traversal: simple, short', ms(s, e));
}

function testTraversalSimpleLongPlan() {
  const { plan, context } = makePlanWithSeededContext({ waypoints: makeWaypoints(100) });

  const s = process.hrtime.bigint();
  for (let i = ITERATIONS; i > 0; i --) {
    plan.traverseRoutes(context, { routeName: 'next' });
  }
  const e = process.hrtime.bigint();

  addResult('Traversal: simple, long', ms(s, e));
}

function testTraversalModerateShortPlan() {
  const { plan, context } = makePlanWithSeededContext({
    waypoints: makeWaypoints(4),
    condition: (r, c) => (c.data.test.match(/^test-value$/)),
  });

  context.setData({
    ...context.data,
    test: 'test-value',
  });

  const s = process.hrtime.bigint();
  for (let i = ITERATIONS; i > 0; i --) {
    plan.traverseRoutes(context, { routeName: 'next' });
  }
  const e = process.hrtime.bigint();

  addResult('Traversal: moderately complex, short', ms(s, e));
}

function testTraversalModerateLongPlan() {
  const { plan, context } = makePlanWithSeededContext({
    waypoints: makeWaypoints(100),
    condition: (r, c) => (c.data.test.match(/^test-value$/)),
  });

  context.setData({
    ...context.data,
    test: 'test-value',
  });

  const s = process.hrtime.bigint();
  for (let i = ITERATIONS; i > 0; i --) {
    plan.traverseRoutes(context, { routeName: 'next' });
  }
  const e = process.hrtime.bigint();

  addResult('Traversal: moderately complex, short', ms(s, e));
}

/* ------------------------------------------------------------------ execute */

testTraversalSimpleShortPlan();
testTraversalSimpleLongPlan();
testTraversalModerateShortPlan();
testTraversalModerateLongPlan();

console.table(results);
