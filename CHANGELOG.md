<a name="4.0.7"></a>
## [4.0.7](https://github.com/dwp/govuk-casa/compare/4.0.6...4.0.7) (2019-10-24)



<a name="4.0.6"></a>
## [4.0.6](https://github.com/dwp/govuk-casa/compare/4.0.5...4.0.6) (2019-09-08)


### Bug Fixes

* strip invalid characters from editorigin ([0484946](https://github.com/dwp/govuk-casa/commit/0484946))



<a name="4.0.5"></a>
## [4.0.5](https://github.com/dwp/govuk-casa/compare/4.0.4...4.0.5) (2019-07-24)



<a name="4.0.4"></a>
## [4.0.4](https://github.com/dwp/govuk-casa/compare/4.0.3...4.0.4) (2019-07-13)



<a name="4.0.3"></a>
## [4.0.3](https://github.com/dwp/govuk-casa/compare/4.0.2...4.0.3) (2019-07-01)



<a name="4.0.2"></a>
## [4.0.2](https://github.com/dwp/govuk-casa/compare/4.0.1...4.0.2) (2019-05-28)


### Bug Fixes

* **journey:** obey conditional on very first waypoint in journey ([4145df0](https://github.com/dwp/govuk-casa/commit/4145df0)), closes [#60](https://github.com/dwp/govuk-casa/issues/60)



<a name="4.0.1"></a>
## [4.0.1](https://github.com/dwp/govuk-casa/compare/4.0.0...4.0.1) (2019-05-24)


### Code Refactoring

* whitelist fields with validators for session ingestion ([57e4c95](https://github.com/dwp/govuk-casa/commit/57e4c95)), closes [#38](https://github.com/dwp/govuk-casa/issues/38)


### Features

* **review:** use govukSummaryList component for Check Answers screen ([e97462c](https://github.com/dwp/govuk-casa/commit/e97462c))


### BREAKING CHANGES

* **review:** Any services using the current layout will need to
modify review block template for each individual page in their service.
* Where previously field validators were optional, they
are now mandatory if the data submitted for those fields is required to
be ingested into the CASA session.



<a name="4.0.0"></a>
# [4.0.0](https://github.com/dwp/govuk-casa/compare/3.0.1...4.0.0) (2019-05-17)


### Features

* **session:** pass referer url in session-timeout redirect ([7e0b3d0](https://github.com/dwp/govuk-casa/commit/7e0b3d0)), closes [#56](https://github.com/dwp/govuk-casa/issues/56)


### Performance Improvements

* **nunjucks:** improve performance of template rendering and loading ([0838fbc](https://github.com/dwp/govuk-casa/commit/0838fbc))


### BREAKING CHANGES

* **nunjucks:** Macros now require access to the same scope as the
templates being rendered, so must be imported with context. See
docs/MIGRATING-3.x-4.x.md



<a name="3.0.1"></a>
## [3.0.1](https://github.com/dwp/govuk-casa/compare/3.0.0...3.0.1) (2019-05-09)



<a name="3.0.0"></a>
# [3.0.0](https://github.com/dwp/govuk-casa/compare/2.4.2...3.0.0) (2019-05-02)


### Bug Fixes

* **security:** remove 'unsafe-inline' from script src in CSP header ([e6a4fbd](https://github.com/dwp/govuk-casa/commit/e6a4fbd))
* **security:** set x-xss-protection header to `1; mode=block` ([9824762](https://github.com/dwp/govuk-casa/commit/9824762))


### Code Refactoring

* remove sass and uglify; compile assets at build time ([97c2ceb](https://github.com/dwp/govuk-casa/commit/97c2ceb))
* remove v1 macros and CSS ([40a419a](https://github.com/dwp/govuk-casa/commit/40a419a))


### Features

* add support for `report-uri` and `report-to` CSP directives ([2616f44](https://github.com/dwp/govuk-casa/commit/2616f44))
* add support for mulitple user journey maps ([c56211b](https://github.com/dwp/govuk-casa/commit/c56211b))


### Performance Improvements

* some small performance improvements to headers middleware ([4831264](https://github.com/dwp/govuk-casa/commit/4831264))


### BREAKING CHANGES

* If your service relies on CASA running sass/uglify
compilation at boot-time, this will no longer be the case and your
sources will need to be compiled in an alternative way.

Signed-off-by: james.gauld <james.gauld@engineering.digital.dwp.gov.uk>
* Any templates using the v1 macros or CSS/Sass rules
will need to migrate to using latest equivalents. See
docs/MIGRARTING-2.x-3.x.md for more details.

Signed-off-by: james.gauld <james.gauld@engineering.digital.dwp.gov.uk>
* **security:** Having 'unsafe-inline' set by default in the CSP header
prevents protection against XSS attacks by allowing any inline JS to be
executed in the browser. I'm removing this in favour of developers
explicitly allowing each inline script block.

Signed-off-by: Niall Molloy <niall.molloy@engineering.digital.dwp.gov.uk>
* The review page page is no longer automatically added and
must now be manually defined in page meta config. Conditional waypoint syntax
change.

Signed-off-by: james.gauld <james.gauld@engineering.digital.dwp.gov.uk>



<a name="2.4.2"></a>
## [2.4.2](https://github.com/dwp/govuk-casa/compare/2.4.1...2.4.2) (2019-04-10)


### Bug Fixes

* error link hrefs ([eafe887](https://github.com/dwp/govuk-casa/commit/eafe887)), closes [#49](https://github.com/dwp/govuk-casa/issues/49)
* **gather-modifier:** postcode reformatting accessibility changes ([f291509](https://github.com/dwp/govuk-casa/commit/f291509))
* udpate csp options docs ([e618bb5](https://github.com/dwp/govuk-casa/commit/e618bb5))
* **validation:** dateObject before/after offset comparison ([6153995](https://github.com/dwp/govuk-casa/commit/6153995))


### Features

* **static:** back to the future fix ([49353d0](https://github.com/dwp/govuk-casa/commit/49353d0))



<a name="2.4.1"></a>
## [2.4.1](https://github.com/dwp/govuk-casa/compare/2.4.0...2.4.1) (2019-03-20)


### Performance Improvements

* **memory:** remove potential source of memory leaks ([7dd658d](https://github.com/dwp/govuk-casa/commit/7dd658d))



<a name="2.4.0"></a>
# [2.4.0](https://github.com/dwp/govuk-casa/compare/2.3.1...2.4.0) (2019-03-05)


### Bug Fixes

* Update typo on documentation for NINO ([9e73565](https://github.com/dwp/govuk-casa/commit/9e73565))


### Features

* **middleware:** allow extra middleware from config ([61db293](https://github.com/dwp/govuk-casa/commit/61db293))



<a name="2.3.1"></a>
## [2.3.1](https://github.com/dwp/govuk-casa/compare/2.3.0...2.3.1) (2019-02-14)



<a name="2.3.0"></a>
# [2.3.0](https://github.com/dwp/govuk-casa/compare/2.2.2...2.3.0) (2019-02-13)


### Bug Fixes

* check compiled assets dir exists ([6e34562](https://github.com/dwp/govuk-casa/commit/6e34562))
* **accessibility:** apply correct error highlighting and linking ([08cb9a8](https://github.com/dwp/govuk-casa/commit/08cb9a8))
* **validation:** fix to the postcode regex ([8f4f2c0](https://github.com/dwp/govuk-casa/commit/8f4f2c0))
* handle userland journey errors ([fcb7842](https://github.com/dwp/govuk-casa/commit/fcb7842))
* sass compilation on Windows ([3af3794](https://github.com/dwp/govuk-casa/commit/3af3794))
* update class name in form helper to be more explicit ([70a0433](https://github.com/dwp/govuk-casa/commit/70a0433))


### Features

* **negative regex:** add negative regex ([ddad066](https://github.com/dwp/govuk-casa/commit/ddad066))
* **postal address:** visually group address lines 1 & 2 together ([dcea90f](https://github.com/dwp/govuk-casa/commit/dcea90f))
* protect against double-submission of journey form ([a366777](https://github.com/dwp/govuk-casa/commit/a366777))
* update journey-form to allow removing footer ([dd9801e](https://github.com/dwp/govuk-casa/commit/dd9801e))



<a name="2.2.2"></a>
## [2.2.2](https://github.com/dwp/govuk-casa/compare/2.2.1...2.2.2) (2019-01-18)


### Bug Fixes

* **postcode-validation:** replace post code validator with a better one ([62280b2](https://github.com/dwp/govuk-casa/commit/62280b2))
* **validation:** allow numeric first line address ([470d9df](https://github.com/dwp/govuk-casa/commit/470d9df))



<a name="2.2.1"></a>
## [2.2.1](https://github.com/dwp/govuk-casa/compare/2.1.1...2.2.1) (2018-12-20)


### Features

* **data gatherers:** add support for gather modifiers ([23f9afc](https://github.com/dwp/govuk-casa/commit/23f9afc))
* **validation:** update nino validation rule with allowWhitespace flag ([5a4e01a](https://github.com/dwp/govuk-casa/commit/5a4e01a))



<a name="2.1.1"></a>
## 2.1.1 (2018-10-27)



