Ziptie
======

Ziptie is a compact, empowering library for two-way data binding between objects, whether they be DOM Objects or plain old JavaScript objects. Ziptie doesn't rely on obnoxious getters and setters to listen for changes either. Just work with objects the way you already do.

```js
var foo = { value: 'foo' };
var bar = { value: 'bar' };

ziptie.fasten(foo, bar);
// => foo <---> bar

foo.value = 'baz';
bar.value;
// => 'baz'

var $foo = $('textarea #foo');
ziptie.fasten($foo, bar);
// => foo <---> bar <---> $foo

foo.value = 'Hmm, I wonder...';
// => $foo now displays 'Hmm, I wonder...'
```

Because the binding is two-way, even though `$foo` and `foo` aren't aware of each other's existence, their values are synchronized by proxy through `bar`. Neat, eh?

So what if we no longer want `foo` to be connected to `bar`?
```js
ziptie.snip(foo, bar);
// => foo <-x-> bar <---> $foo
```

For now, you can only snip zipties that you've explicitly created - maybe in the future some graph traversal is in order.

