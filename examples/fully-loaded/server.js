import application from './app.js';

// Here we're injecting some config as it might be read from process.env
application({
  MOUNT_URL: '/fully-loaded/',
}).listen(3000, () => {
  console.log('running');
});
