# element-props [![status](https://travis-ci.org/spectjs/element-props.svg?branch=master)](https://travis-ci.org/spectjs/element-props) [![size](https://img.shields.io/bundlephobia/minzip/element-props?label=size)](https://bundlephobia.com/result?p=element-props)

Create `props` object for an element, normalizing access to element attributes/properties.

[![npm i element-props](https://nodei.co/npm/element-props.png?mini=true)](https://nodei.co/npm/element-props/)

```js
import props from 'element-props'

let el = document.getElementById('my-element')
el.props = props(el, { z: Number })

// preserves value type
el.props.x = 1
el.getAttribute('x') // '1'
el.props.x // 1

// normalizes boolean attribs
el.setAttribute('y', '')
el.props.y // true
el.props.y = false
el.getAttribute('y') // null

// functions 👌
el.props.onclick = e => action()

// spread 👌
{...el.props} // { y: false, x: 1, id: 'my-element' }

// observe changes
;(async () => {
  for await (let props of el.props) console.log({...props})
})()

// or with rxjs/observables + pipes
el.props |> map(props => console.log(props))
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
// observable
el.props[Symbol.observable]().subscribe(props => console.log(props))

// async iterable
for await (const props of el.props) console.log(props)
```

### polyfill

Add `props` to all HTML elements by including polyfill for `Element.prototype.props`:

```js
import 'element-props/polyfill'

document.body.id = 'my-body'
document.body.props // { id: 'my-body' }
```

### Conventions

* Element property takes precedence over attribute.
* `on*` property can only be a function.
* `style` can only be an object.
* `id` can only be a string.
* Empty strings are considered booleans: `<a disabled />` → `a.props.disabled === true`

Internally uses _Proxy_, (no IE11 support, but in theory possible with  _MutationObserver_ fallback)

Inspired by this [tweet](https://twitter.com/WebReflection/status/1260948278977409026?s=20) with spreading [hint](https://github.com/tc39/proposal-object-rest-spread/issues/69#issuecomment-633232470).


## License

ISC © Dmitry Iv.

<p align="center">ॐ</p>
