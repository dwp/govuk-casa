// Concatenate waypoint objects, making sure that duplicate keys are indexed
// with an incrementing integer

function getIndex(waypointId) {
  const m = waypointId.match(/:([0-9]+)$/);
  return m && m[1] ? parseInt(m[1]) : 0;
}

function bumpIndex(waypointId) {
  const index = getIndex(waypointId);
  return waypointId.replace(/:.*$/, '') + `:${index + 1}`;
}

module.exports = function concactWaypoints(...sources) {
  return sources.reduce((obj, source) => {
    Object.keys(source).forEach((key) => {
      const value = source[key];
      while(obj.hasOwnProperty(key)) {
        key = bumpIndex(key);
      }
      obj[key] = value;
    });

    return obj;
  }, {});
};
