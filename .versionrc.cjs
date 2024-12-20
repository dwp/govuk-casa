module.exports = {
  skip: {
    tag: true,
  },
  tagPrefix: "",
  bumpFiles: [
    {
      filename: "package.json",
      type: "json",
    },
    {
      filename: "package-lock.json",
      type: "json",
    },
  ],
};
