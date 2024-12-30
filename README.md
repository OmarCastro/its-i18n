# its-i18n

[![npm version](https://omarcastro.github.io/its-i18n/reports/npm-version-badge-a11y.svg)](https://www.npmjs.com/package/its-i18n)
[![latest version](https://omarcastro.github.io/its-i18n/reports/repo-release-a11y.svg)](https://github.com/OmarCastro/its-i18n/releases/latest)
[![License](https://omarcastro.github.io/its-i18n/reports/license-badge-a11y.svg)](https://github.com/OmarCastro/its-i18n/blob/main/LICENSE)
[![Continuous Integration Test Report](https://omarcastro.github.io/its-i18n/reports/test-results/test-results-badge-a11y.svg)](https://omarcastro.github.io/its-i18n/reports/playwright-report)
[![Test Coverage Report](https://omarcastro.github.io/its-i18n/reports/coverage/final/coverage-badge-a11y.svg)](https://omarcastro.github.io/its-i18n/reports/coverage/final)


A library used to apply i18n on html automatically


## Documentation

You can find the full documentation [on the github page](https://omarcastro.github.io/its-i18n/).  

This readme will the basic on how to get started in nodejs

### Getting started

install the module using npm

```bash
npm install its-i18n
```

And then use it and register as a webcomponent

```javascript
import element from 'its-i18n'

customElements.define('i18n-container', element)
```

### Examples

You can see the examples [on the github page](https://omarcastro.github.io/its-i18n/#examples) and interact with them

### Contributing

TLDR version of https://omarcastro.github.io/its-i18n/contributing:

- Have NodeJs & Git installed

```bash
git clone https://github.com/OmarCastro/its-i18n.git
cd its-i18n
npm run dev:open
```

`npm ci` runs automatically when `npm run dev:open` (or any of the npm scripts) when node_modules is absent on, if you do not wish to open the browser, run `npm run dev` instead

# Playground

You can play with the library by going to the `playground/` folder of by using an [online IDE](https://stackblitz.com/github/OmarCastro/its-i18n/tree/main/playground?file=index.html)
