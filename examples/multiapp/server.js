const application = require('./app.js');

const server = application({
  MOUNT_URL: '/multiapp/',
}).listen(process.env.PORT ?? 3000, () => {
  console.log('running');
});
