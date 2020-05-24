# element-props [![status](https://travis-ci.org/spectjs/element-props.svg?branch=master)](https://travis-ci.org/spectjs/element-props) [![size](https://img.shields.io/bundlephobia/minzip/element-props?label=size)](https://bundlephobia.com/result?p=element-props)

Create `props` object for an element, providing normalized way to read element attributes/properties.

[![npm i element-props](https://nodei.co/npm/element-props.png?mini=true)](https://nodei.co/npm/element-props/)

```js
import props from 'element-props'

let el = document.getElementById('my-element')
el.props = props(el)

el.props.id
// 'my-element'

el.setAttribute('x', '1')
el.props.x // 1

el.y = 'abc'
{...el.props} // { y: 'abc', x: 1, id: 'my-element' }
el.getAttribute('y') // 'abc'
```

## API

### element.props = props(element, types?)

Create properties object `props` for an `element`, with optional `types` defining prop types. Type can be any data class like _Number_, _Boolean_, _String_, _Array_, _Object_, _Data_, _RegExp_, or string → data function like _JSON.parse_.

```js
el.props = props(el, {n:Number, b:Boolean, o:Object, a:Array, s:String, d:Date})
el.props.n = '1'
el.setAttribute('b', '')
el.s = 'abc'
el.setAttribute('a', '[1,2,3]')
el.setAttribute('o', '{foo:"bar"}')

{...el.props} // {n: 1, b: true, s: 'abc', o: {foo:'bar'}, a: [1,2,3]}
```

Props also expose _observable_ and _asyncIterator_ interfaces:

```js
// subscribe
el.props[Symbol.observable]().subscribe(props => console.log(props))

// iterable
el.props[Symbol.asyncIterator]()
```

### Conventions

* Element property takes precedence over attribute.
* `on*` property can only be a function.
* `style` can only be an object.
* `id` can only be a string.
* Empty strings are considered booleans: `<a disabled />` → `a.props.disabled === true`

Internally uses _Proxy_, IE11 support suffers. <!-- with _MutationObserver_ fallback for IE11. -->

Inspired by this [tweet](https://twitter.com/WebReflection/status/1260948278977409026?s=20) with spreading [hint](https://github.com/tc39/proposal-object-rest-spread/issues/69#issuecomment-633232470).


## License

ISC © Dmitry Iv.

<p align="center">ॐ</p>
