import application from './app.js';

// Here we're injecting some config as it might be read from process.env
application({
  MOUNT_MAIN_URL: '/main/',
  MOUNT_LOOP_URL: '/hobbies/',
}).listen(3000, () => {
  console.log('running');
});
