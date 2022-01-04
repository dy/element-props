# element-props [![status](https://travis-ci.org/spectjs/element-props.svg)](https://travis-ci.org/spectjs/element-props) [![size](https://img.shields.io/bundlephobia/minzip/element-props?label=size)](https://bundlephobia.com/result?p=element-props)

Normalize access to element attributes/properties.

[![npm i element-props](https://nodei.co/npm/element-props.png?mini=true)](https://nodei.co/npm/element-props/)

```js
import props from 'element-props.js'

let el = document.getElementById('my-element')
el.props = props(el, { z: Number })

// numeric
el.props.x = 1
el.getAttribute('x') // '1'
el.props.x // 1

// boolean
el.setAttribute('disabled', '')
el.props.disabled // true
el.props.disabled = false
el.getAttribute('disabled') // null

// functions
el.props.onclick = e => ()

// spread
{...el.props} // { y: false, x: 1, id: 'my-element' }
```

## API

### element.props = props(element, propTypes?)

Create `props` for an `element`, with optional `propTypes = { propName: Type }`.<br/>
_Type_ is any data class like _Number_, _Boolean_, _String_, _Array_, _Object_, _Data_, _RegExp_, or `string => data` function like _JSON.parse_ (used for _Array_ and _Object_).

```js
el.props = props(el, {n:Number, b:Boolean, o:Object, a:Array, s:String, d:Date})
el.props.n = '1'
el.setAttribute('b', '')
el.s = 'abc'
el.setAttribute('a', '1,2,3')
el.setAttribute('o', '{foo:"bar"}')

{...el.props} // {n: 1, b: true, s: 'abc', o: {foo:'bar'}, a: [1,2,3]}
```

`props` handle input elements - _text_, _checkbox_, _select_:

```js
el.props = document.querySelector('#checkbox')
el.props.value = true

el.value // 'on'
el.checked // true
el.props.value // true
el.getAttribute('value') // 'on'
el.getAttribute('checked') // ''
```

One may think it’s bad to augment DOM objects, but in controlled setting, eg. custom elements, that’s totally fine.

### augment

Add `props` to all HTML elements by including augment for `Element.prototype.props`:

```js
import 'element-props/augment.js'

document.body.id = 'my-body'
document.body.props // { id: 'my-body' }
```

### obervable

Observable version of props provides a way to track props changes, exposing _observable_ and _asyncIterator_ interfaces:

```js
import props from 'element-props/observable.js'

el.props = props(el)

// observable
el.props[Symbol.observable]().subscribe(props => console.log(props))

// async iterable
;(async () => {
  for await (let props of el.props) console.log({...props})
})()

// rxjs/observables + pipes
el.props |> map(props => console.log(props))
```

### Convention

* Element property takes precedence over attribute. (meaning?)
* `on*` property can only be a function.
* `onEvt` === `onevt`.
* `style` can only be an object.
* `id` can only be a string.
* Empty strings are considered booleans: `<a disabled />` → `a.props.disabled === true`

Internally uses _Proxy_, (no IE11 support, but in theory possible with  _MutationObserver_ fallback)

Inspired by this [tweet](https://twitter.com/WebReflection/status/1260948278977409026?s=20) with spreading [hint](https://github.com/tc39/proposal-object-rest-spread/issues/69#issuecomment-633232470).

## See also

* [Element properties proposal](https://github.com/developit/unified-element-properties-proposal)
* [element-params](https://github.com/spectjs/element-params)

## License

ISC © Dmitry Iv.

<p align="center">ॐ</p>
