const application = require('./app.js');

// Here we're injecting some config as it might be read from process.env
const server = application({
  MOUNT_URL: '/barebones/',
}).listen(3000, () => {
  console.log('running');
});
