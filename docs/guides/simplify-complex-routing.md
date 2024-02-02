# Simplify complex routing

In scenarios where you can go from waypoint A to more than two onward waypoints, the route condition logic for this can sometimes get messy.

In a simple A->B, A->C scenario, you only need two conditions which are usually the inverse of each other.

When we get to A->B, A->C, A->D, we start needing to negate all other conditions, which gets exponentially more verbose.

For example, something like this:

```javascript
plan.setRoute(
  "a",
  "b",
  (r, c) =>
    c.data["a"].conditionB &&
    !c.data["a"].conditionC &&
    !c.data["a"].conditionD,
);
plan.setRoute(
  "a",
  "c",
  (r, c) =>
    !c.data["a"].conditionB &&
    c.data["a"].conditionC &&
    !c.data["a"].conditionD,
);
plan.setRoute(
  "a",
  "d",
  (r, c) =>
    !c.data["a"].conditionB &&
    !c.data["a"].conditionC &&
    c.data["a"].conditionD,
);
```

Could be be more easily read by refactoring the condition into a reusable function. For example:

```javascript
const test = (r, c) => {
  if (c.data["a"].conditionB) return r.target === "b";
  if (c.data["a"].conditionC) return r.target === "c";
  if (c.data["a"].conditionD) return r.target === "d";
};

plan.setRoute("a", "b", test);
plan.setRoute("a", "c", test);
plan.setRoute("a", "d", test);
```
