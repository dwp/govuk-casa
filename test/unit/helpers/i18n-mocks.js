const translator = () => ({
  t: function t(s) {
    // Needs to be a bind()able function
    return `${s}_translated`;
  },
});

module.exports = {
  translator,
};
