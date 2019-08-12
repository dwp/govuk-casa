# Style Guide (WIP)

> This is a proposal which we're not necessarily strictly following yet; more of an aspiration

## Including dependencies

* Do not omit file extensions from imported modules; use `require('./file.js')` rather than `require('./file')`

## Functions

* Use a maximum of 3 parameters in function signatures; where more than 3 are required, fallback to using a single parameter of an object type
* Define the options parameter last or, in the case of an object parameter, name it `options`
* For callback functions, the first parameter is reserved for an error, derived from one of the JavaScript built-in error types (`Error`, `SyntaxError`, etc)
* Separate concerns into separate functions, e.g. don't call an API, execute business logic, write to disk all in one function. Instead chain the results of separate functions together (using the output of one as input for the next).

## Unit tests

Guidance for using test doubles (mocks, stubs, spies, fakes):

* Use of doubles is encouraged where using real instances of a dependency a) are not idempotent (e.g. `Date.now()`), or b) may cause side effects (e.g. writes to a DB, reads from fiesystem)
* "Don't mock what you don't own"; if you mock functionality of a third party dependency, and a later release of that dependency changes its API, then your tests will still pass, but the production app will fail. Use test doubles for third-party dependencies, but with caution.
* There are stubs for most public CASA classes/functions in `test/unit/helpers/`
* Where feasible, design your functions to use dependency injection rather than using `require()`
