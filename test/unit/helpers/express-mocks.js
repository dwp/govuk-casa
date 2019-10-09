const sinon = require('sinon');

const app = () => {
  const appObj = {};
  appObj.all = sinon.stub().returns(appObj);
  appObj.set = sinon.stub().returns(appObj);
  appObj.use = sinon.stub().returns(appObj);
  return appObj;
};

const router = () => {
  const routerObj = {};
  routerObj.get = sinon.stub().returns(routerObj);
  routerObj.use = sinon.stub().returns(routerObj);
  return routerObj;
};

const request = () => ({
  headers: {},
  method: 'GET',
  query: {},
  session: {
    save: sinon.stub().callsFake(cb => cb()),
    destroy: sinon.stub().callsFake(cb => (cb())),
  },
});

const response = () => {
  const res = {};

  // Some stubs must mark headers as sent
  function setHeadersSent() {
    res.headersSent = true;
    return res;
  }

  res.clearCookie = sinon.stub().returns(res);
  res.redirect = sinon.stub().callsFake(setHeadersSent);
  res.render = sinon.stub().returns(res);
  res.send = sinon.stub().callsFake(setHeadersSent);
  res.setHeader = sinon.stub().returns(res);
  res.status = sinon.stub().returns(res);
  res.locals = {};

  return res;
};

module.exports = {
  app,
  request,
  response,
  router,
};
