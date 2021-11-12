# cssfn - Writes CSS in JavaScript way

A lib for generating _Style Sheet_ (css) with _JavaScript function_.  
Similar to _React Hooks_ but for **generating css dynamically**.

By underlying JavaScript language, the css can be easily exported/imported as a regular JavaScript module.

The generated css can be exported to css `toString()` or attached to DOM directly `.attach()`.

## Preview

```js
export const usesAwesomeButton = () => composition([
    imports([
        stripoutControl(), // clear browser's default styles
        
        usesButtonBase(), // imports css from a generic button
        
        // imports any stuff here...
    ]),
    layout({
        display       : 'flex',
        flexDirection : 'row',
        background    : 'pink',
        color         : 'darkred',
        
        // writes the css declaration similar to regular css
        
        ...children(['span', '.logo'], [
            imports([
                // imports any stuff here...
            ]),
            layout({
                // writes the css declaration similar to regular css
            }),
        ]),
    }),
    variants([
        rule('.big', [
            layout({
                fontSize: 'xx-large',
                // ....
            })
        ]),
        rule('.dark', [
            // ...
        ]),
    ]),
    states([
        rule([':disabled', '.disabled'], [
            // ....
        ]),
    ]),
]);

// attach the css to DOM:
createSheet(() => [
    global([
        rule('.awesome-btn', [
            imports([
                usesAwesomeButton(),
            ]),
        ]),
    ]),
])
.attach();
```

Then we can consume our generated css like this:

```html
<script src="button-style.js">
</script>

<button class="awesome-btn">Awesome!</button>
```

## Features

* includes all Vanilla & ES6 JavaScript features
* Lazy execution (your function will be executed on demand
* Cached - your function only be executed once (or never if not needed)
* IntelliSense supported - Our cssfn is written in TypeScript (superset of JavaScript)
* CSS Variable Management - Never write variable name in plain string.
* CSS Config Management - Shares a common setting to many components.

## Installation

Using npm:
```
npm i @cssfn/cssfn
```

## Support Us

If you feel our lib is useful for your projects,  
please make a donation to avoid our project from extinction.

We always maintain our projects as long as we are still alive.

[[Make a donation](https://ko-fi.com/heymarco)]
