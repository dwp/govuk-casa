const express = require('express');
const request = require('supertest');

const bodyParser = require('../../../lib/commonBodyParser.js');

describe('commonBodyParser()', () => {
  app = express();
  app.use(bodyParser);
  app.post('/', (req, res) => {
    res.set('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify(req.body))
  });

  it('should parse string', (done) => {
    request(app).post('/').send('a=test').expect({
      a: 'test',
    }).end(done);
  });

  it('should parse object', (done) => {
    request(app).post('/').send('a[b]=test').expect({
      a: {
        b: 'test',
      },
    }).end(done);
  });

  it('should parse array', (done) => {
    request(app).post('/').send('a[]=test1&a[]=test2').expect({
      a: [ 'test1', 'test2' ],
    }).end(done);
  });

  it('should throw on presence of keyword structures', (done) => {
    const queue = [
      '__proto__=x',
      '__proto__[a]=x',
      'a[__proto__][b]=x',
      'a[__proto__][b]=x',
      encodeURI('a[__proto__][b]=test'),
      'constructor=x',
      'constructor[a]=x',
      'constructor[prototype][a]=x',
      'a[constructor\ufeff][prototype][toString]=x',
      'constructor[valueOf]={return 1}',
      'a[constructor][prototype][toString]=x',
      encodeURI('a[constructor][b]=x'),
      'a[prototype][b]=x',
      encodeURI('a[prototype][b]=x'),
    ].map(test => (request(app).post('/').send(test).expect(403)));

    Promise.all(queue).then(() => done()).catch(done);
  });

  it('should not throw on presence of keywords in a valid context', (done) => {
    const queue = [
      'prototype',
      'constructor',
    ].map(test => (request(app).post('/').send(test).expect(200)));

    Promise.all(queue).then(() => done()).catch(done);
  })
});
