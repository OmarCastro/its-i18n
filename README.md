# its-i18n

[![Code Coverage](https://omarcastro.github.io/its-i18n/reports/coverage/unit/coverage-badge-a11y.svg "Code Coverage")](https://omarcastro.github.io/its-i18n/reports/coverage/unit) [![Test results](https://omarcastro.github.io/its-i18n/reports/test-results/test-results-badge-a11y.svg "Test results")](https://omarcastro.github.io/its-i18n/reports/playwright-report) <a href="https://codeclimate.com/github/OmarCastro/its-i18n" aria-label="view code climate" title="view code climate"><picture>
    <source srcset="https://img.shields.io/codeclimate/maintainability/OmarCastro/its-i18n?style=for-the-badge&logo=codeclimate&logoColor=%23ccc&color=%23070" media="(prefers-color-scheme: dark)"> 
    <img src="https://img.shields.io/codeclimate/maintainability/OmarCastro/its-i18n?style=for-the-badge&logo=codeclimate&logoColor=%23333&labelColor=%23ccc&color=%2390e59a">
</picture></a> ![License](https://omarcastro.github.io/its-i18n/reports/license-badge-a11y.svg "License")<a href="https://www.npmjs.com/package/its-i18n" aria-label="go to NPM package" title="go to NPM package"><picture>
    <source srcset="https://img.shields.io/npm/v/its-i18n?style=for-the-badge&logo=npm&logoColor=%23ccc&color=%2306A" media="(prefers-color-scheme: dark)"> 
    <img src="https://img.shields.io/npm/v/its-i18n?style=for-the-badge&logo=npm&logoColor=%23333&labelColor=%23ccc&color=%23007ec6">
</picture></a><a href="https://github.com/OmarCastro/its-i18n/releases/latest" aria-label="go to release page" title="go to release page"><picture>
    <source srcset="https://img.shields.io/github/v/release/OmarCastro/its-i18n?style=for-the-badge&logo=github&logoColor=%23ccc&color=%2306A" media="(prefers-color-scheme: dark)"> 
    <img src="https://img.shields.io/github/v/release/OmarCastro/its-i18n?style=for-the-badge&logo=github&logoColor=%23333&labelColor=%23ccc">
</picture></a><a href="https://github.com/OmarCastro/its-i18n" aria-label="go to Github" title="go to Github"><picture>
    <source srcset="https://img.shields.io/github/stars/OmarCastro/its-i18n?style=for-the-badge&logo=github&logoColor=%23ccc&color=%2306A" media="(prefers-color-scheme: dark)"> 
    <img src="https://img.shields.io/github/stars/OmarCastro/its-i18n?style=for-the-badge&logo=github&logoColor=%23333&labelColor=%23ccc">
</picture></a><a href="https://github.com/OmarCastro/its-i18n" aria-label="go to Github" title="go to Github"><picture>
    <source srcset="https://img.shields.io/github/forks/OmarCastro/its-i18n?style=for-the-badge&logo=github&logoColor=%23ccc&color=%2306A" media="(prefers-color-scheme: dark)"> 
    <img src="https://img.shields.io/github/forks/OmarCastro/its-i18n?style=for-the-badge&logo=github&logoColor=%23333&labelColor=%23ccc">
</picture></a>

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
