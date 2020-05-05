<a name="6.4.1"></a>
## [6.4.1](https://github.com/dwp/govuk-casa/compare/6.4.0...6.4.1) (2020-05-05)


### Performance Improvements

* user faster clone when reading page data ([45ba9e4](https://github.com/dwp/govuk-casa/commit/45ba9e4))



<a name="6.4.0"></a>
# [6.4.0](https://github.com/dwp/govuk-casa/compare/6.3.2...6.4.0) (2020-05-04)


### Features

* add option to check validation state during traversal ([210dfb0](https://github.com/dwp/govuk-casa/commit/210dfb0)), closes [#118](https://github.com/dwp/govuk-casa/issues/118)



<a name="6.3.2"></a>
## [6.3.2](https://github.com/dwp/govuk-casa/compare/6.3.1...6.3.2) (2020-04-28)



<a name="6.3.1"></a>
## [6.3.1](https://github.com/dwp/govuk-casa/compare/6.3.0...6.3.1) (2020-04-24)


### Bug Fixes

* changelog typo ([9f3103a](https://github.com/dwp/govuk-casa/commit/9f3103a))



<a name="6.3.0"></a>
# [6.3.0](https://github.com/dwp/govuk-casa/compare/6.2.0...6.3.0) (2020-04-24)


### Bug Fixes

* Welsh local for date macro had incorrect keys ([588c17b](https://github.com/dwp/govuk-casa/commit/588c17b))


### Features

* label graph edges with routing function name ([ddba1ba](https://github.com/dwp/govuk-casa/commit/ddba1ba))
* **components:** add wrapper for govukCharacterCount component ([0f4d54a](https://github.com/dwp/govuk-casa/commit/0f4d54a))



<a name="6.2.0"></a>
# [6.2.0](https://github.com/dwp/govuk-casa/compare/6.1.0...6.2.0) (2020-04-22)


### Bug Fixes

* mount static handlers on the proxy url ([eaf8062](https://github.com/dwp/govuk-casa/commit/eaf8062))


### Features

* add means to access Plan's raw graph structure ([650a0a7](https://github.com/dwp/govuk-casa/commit/650a0a7))



<a name="6.1.0"></a>
# [6.1.0](https://github.com/dwp/govuk-casa/compare/6.0.0...6.1.0) (2020-04-21)


### Features

* add proxyMountUrl to support proxying servers ([f8ce731](https://github.com/dwp/govuk-casa/commit/f8ce731))
* **templates:** add Google Tag Manager attributes to radio/checkboxes ([7d36f9b](https://github.com/dwp/govuk-casa/commit/7d36f9b)), closes [#116](https://github.com/dwp/govuk-casa/issues/116)



<a name="6.0.0"></a>
# [6.0.0](https://github.com/dwp/govuk-casa/compare/5.2.2...6.0.0) (2020-03-26)


### Code Refactoring

* change minimum NodeJS version to 12 ([6e362e1](https://github.com/dwp/govuk-casa/commit/6e362e1))


### Features

* add support for custom data model ([a8ffac5](https://github.com/dwp/govuk-casa/commit/a8ffac5)), closes [#107](https://github.com/dwp/govuk-casa/issues/107)
* add support for string interpolation in validation error messages ([e015c5c](https://github.com/dwp/govuk-casa/commit/e015c5c)), closes [#54](https://github.com/dwp/govuk-casa/issues/54)
* Adding ability to set the text of a button in a journey ([340a238](https://github.com/dwp/govuk-casa/commit/340a238))
* **test:** add utility for testing Plan traversals. ([4e69673](https://github.com/dwp/govuk-casa/commit/4e69673))
* **validation:** pass full journey context to validators and conditionals ([bc12325](https://github.com/dwp/govuk-casa/commit/bc12325)), closes [#89](https://github.com/dwp/govuk-casa/issues/89)


### BREAKING CHANGES

* All validator functions must reject with an instance of
`ValidationError`, rather than the basic object as previously. See
`docs/MIGRATION-5.x-6.x.md` for more details.
* A minimum of NodeJS 12.0.0 is now required to use
CASA.
* **validation:** The apis for field validator functions, field validator conditionals
and the Validation.processor() function, have all changed and existing codebases
will need to be modified to continue working as expected. See MIGRATING-5.x-6.x.md
for details on these changes.



<a name="5.2.2"></a>
## [5.2.2](https://github.com/dwp/govuk-casa/compare/5.2.1...5.2.2) (2020-03-16)


### Bug Fixes

* **ci:** include locale specifically when running zap ([677a575](https://github.com/dwp/govuk-casa/commit/677a575))



<a name="5.2.1"></a>
## [5.2.1](https://github.com/dwp/govuk-casa/compare/5.2.0...5.2.1) (2020-01-15)


### Bug Fixes

* traverse to correct page after edit if linear journey is shortened ([6d3beb2](https://github.com/dwp/govuk-casa/commit/6d3beb2))



<a name="5.2.0"></a>
# [5.2.0](https://github.com/dwp/govuk-casa/compare/5.1.0...5.2.0) (2019-12-05)


### Features

* stop traversal beyond a given editorigin ([9228cb5](https://github.com/dwp/govuk-casa/commit/9228cb5))



<a name="5.1.0"></a>
# [5.1.0](https://github.com/dwp/govuk-casa/compare/5.1.0-beta.3...5.1.0) (2019-11-08)


### Bug Fixes

* pass logger to static middleware function ([62dff0e](https://github.com/dwp/govuk-casa/commit/62dff0e))
* **session:** Ensure sessionExpiryController() has new session ([1a434a0](https://github.com/dwp/govuk-casa/commit/1a434a0))



<a name="5.1.0-beta.3"></a>
# [5.1.0-beta.3](https://github.com/dwp/govuk-casa/compare/5.1.0-beta.2...5.1.0-beta.3) (2019-10-22)


### Bug Fixes

* Remove referer query before session timeout redirect ([31d54e8](https://github.com/dwp/govuk-casa/commit/31d54e8))


### Features

* **session:** add sessionExpiryController() config option ([c3edb27](https://github.com/dwp/govuk-casa/commit/c3edb27))



<a name="5.1.0-beta.2"></a>
# [5.1.0-beta.2](https://github.com/dwp/govuk-casa/compare/5.1.0-beta.1...5.1.0-beta.2) (2019-10-21)


### Bug Fixes

* **traversal:** inject correct origin when calculating altered route after edit ([0c84170](https://github.com/dwp/govuk-casa/commit/0c84170))
* **validator:** add type checking to email validator ([57de412](https://github.com/dwp/govuk-casa/commit/57de412))



<a name="5.1.0-beta.1"></a>
# [5.1.0-beta.1](https://github.com/dwp/govuk-casa/compare/5.0.1...5.1.0-beta.1) (2019-10-20)


### Bug Fixes

* Don’t use <footer> to wrap form buttons ([ca91fae](https://github.com/dwp/govuk-casa/commit/ca91fae))
* Update e-mail validation ([28cd300](https://github.com/dwp/govuk-casa/commit/28cd300))
* use correct logger in skip middleware ([66360a3](https://github.com/dwp/govuk-casa/commit/66360a3))
* **gather:** ensure gathered state is set for solely optional forms ([039fb94](https://github.com/dwp/govuk-casa/commit/039fb94))
* **plan:** take into account route conditions when calculating previous waypoint ([41e2208](https://github.com/dwp/govuk-casa/commit/41e2208))


### Features

* add functionality to convert from map to plan ([d98e055](https://github.com/dwp/govuk-casa/commit/d98e055))


### Performance Improvements

* **plan:** add option to stop traversal early when conditions are met ([c4ab26e](https://github.com/dwp/govuk-casa/commit/c4ab26e))



<a name="5.0.1"></a>
## [5.0.1](https://github.com/dwp/govuk-casa/compare/5.0.0...5.0.1) (2019-09-08)


### Bug Fixes

* strip invalid characters from editorigin ([0a9d8a8](https://github.com/dwp/govuk-casa/commit/0a9d8a8))



<a name="5.0.0"></a>
# [5.0.0](https://github.com/dwp/govuk-casa/compare/5.0.0-alpha.4...5.0.0) (2019-08-15)

### Features

* Upgrade to GOV.UK Frontend 3.0.0 ([e986a56](https://github.com/dwp/govuk-casa/commit/e986a56))
* add support for hooks as arrays ([047ed46](https://github.com/dwp/govuk-casa/commit/047ed46))
* implement graph data structure for handling journey traversals ([9f1d920](https://github.com/dwp/govuk-casa/commit/9f1d920))

### Bug Fixes

* stop traversal once a loop is encountered ([33ce8f6](https://github.com/dwp/govuk-casa/commit/33ce8f6))

### Code Refactoring

* rename variables and change references to request variables ([2b76135](https://github.com/dwp/govuk-casa/commit/2b76135))

### BREAKING CHANGES

* GOVUK Frontend - See all changes documented in https://github.com/alphagov/govuk-frontend/releases/tag/v3.0.0
* All existing references to `req.*` casa variables will need to be modified.
* The UserJourney.* classes are no longer supported and existing journey
 definitions will need to be modified to use the new `Plan` class.



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



