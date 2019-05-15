const npath = require('path');
const { expect } = require('chai');
const express = require('express');
const nunjucks = require('nunjucks');

const middleware = require('../../../app/middleware/nunjucks.js');

describe('Middleware: nunjucks', () => {
  let expressApp;

  const viewDirs = [
    npath.resolve(__dirname, '../testdata/views'),
  ];
  const govukTemplatePath = npath.resolve(__dirname, '../testdata/views/layouts/template.njk');
  const casaRoot = npath.resolve(__dirname, '..', '..', '..');

  beforeEach(() => {
    expressApp = express();
  });

  it('should throw an exception when the govuk template path does not point to the template file', () => {
    expect(() => {
      middleware(expressApp, viewDirs, 'invalid-path')
    }).to.throw(TypeError, 'template.njk');
  });

  it('should add all view directories to the template loader in the correct priority order', () => {
    middleware(expressApp, ['dir1', 'dir2'], govukTemplatePath);
    const paths = expressApp.get('nunjucksEnv').loaders[0].searchPaths;
    expect(paths).to.deep.equal([
      npath.join(casaRoot, 'dir1'),
      npath.join(casaRoot, 'dir2'),
      npath.join(casaRoot, 'app/views'),
      npath.dirname(govukTemplatePath),
    ]);
  });

  it('should configure loader to cache templates', () => {
    middleware(expressApp, null, govukTemplatePath);
    const loader = expressApp.get('nunjucksEnv').loaders[0];
    return expect(loader.noCache).to.be.false;
  });

  it('should set the Express view engine to "njk"', () => {
    middleware(expressApp, null, govukTemplatePath);
    return expect(expressApp.get('view engine')).to.equals('njk');
  });

  it('should store the nunjucks environment in the Express application', () => {
    middleware(expressApp, null, govukTemplatePath);
    return expect(expressApp.get('nunjucksEnv')).to.be.an.instanceOf(nunjucks.Environment);
  });
});
