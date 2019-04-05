# `Util.js`

General-purpose utilities functions.

```javascript
// Require in your scripts
const Util = require('@dwp/govuk-casa/lib/Util.js');
```

### `getPageIdFromUrl(String)`

Extract a waypoint from any given URL. This is essentially just the `pathname` of a URL, with leading and trailing `/` removed.

```javascript
getPageIdFromUrl('http://example.test/this/is/a/waypoint/');
```

```javascript
this/is/a/waypoint
```

### `getPageIdFromJourneyUrl(UserJourney.Map, String)`

Extract the waypoint portion of a URL generated for specific User Journey.

```javascript
const map = new UserJourney.Map('example-abc');
const url = '/example-abc/my/waypoint';

getPageIdFromJourneyUrl(map, url);
```

```javascript
my/waypoint
```

### `getJourneyFromUrl(Array<UserJourney.Map>, String)`

Determine which of the given `UserJourney.Map` instances is referred to in the given url.

```javascript
const maps = [
  new UserJourney.Map('example-abc'),
  new UserJourney.Map('another'),
];
const url = '/another/my/waypoint';

getJourneyFromUrl(maps, url);
```

```javascript
// Returns the "another" journey
```

### `objectPathValue(Object, ...String)`

### `objectPathString(...String)`

### `normalizeHtmlObjectPath(String)`

### `isEmpty(mixed, Object)`


