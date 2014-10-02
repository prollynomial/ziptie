Ziptie
======
[![](http://img.shields.io/npm/v/ziptie.svg?style=flat-square)](https://npmjs.org/package/ziptie)

Dependencies
------------
Ziptie currently has no dependencies! Likely, a dependency on `lodash.assign` will be added in the near future.

Using
-----
Ziptie is a compact, empowering library for two-way data binding between objects, whether they be DOM Objects or plain old JavaScript objects. Ziptie doesn't rely on obnoxious getters and setters to listen for changes either. Just work with objects the way you already do.

```js
var foo = { value: 'foo' };
var $bar = $('textarea #foo');

var zip = new Ziptie({
    view: {
        target: $bar,
        property: 'value',
        event: 'input'
    },
    model: {
        target: foo,
        property: 'value'
    }
});
// foo and $bar are now linked. When a user inputs text on $bar, foo is updated. As soon as this Ziptie is created, the text of $bar is updated.

// When the user types 'Testing - 1, 2, 3':
console.log(foo.value);
// => 'Testing - 1, 2, 3'

foo.value = 'Hello?';
// On screen, $bar now contains the text 'Hello?'.

// Cut the cord:
zip.snip();

foo.value = 'Is this thing on?'
// $bar still displays 'Hello?'.
```

License
-------
Ziptie may be freely distributed under the MIT license, because freedom.