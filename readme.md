# element-props <!--[![status](https://travis-ci.org/spectjs/element-props.svg)](https://travis-ci.org/spectjs/element-props)--> [![test](https://github.com/spectjs/element-props/actions/workflows/test.yml/badge.svg)](https://github.com/spectjs/element-props/actions/workflows/test.yml) [![size](https://img.shields.io/bundlephobia/minzip/element-props?label=size)](https://bundlephobia.com/result?p=element-props)

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

### props(element, types?, onchange?)

Create `props` for an `element`, with optional `types = { propName: Type }` (compat. with [attr-types](https://github.com/qwtel/attr-types)).<br/>
_Type_ is any data class like _Number_, _Boolean_, _String_, _Array_, _Object_, _Data_, _RegExp_, or `string => data` function like _JSON.parse_ (used for _Array_ and _Object_).

```js
el.props = props(el, {n:Number, b:Boolean, o:Object, a:Array, s:String, d:Date}, (key, val) => {})
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

### parse(string, Type?)

Convert string value into defined type _or_ detect type automatically (tiny _auto-parse_).

```js
import { parse } from './element-props.js'

parse('true', Boolean) // true
parse('123') // 123
parse('1,2,3', Array) // [1, 2, 3]
parse('{ a: 1, b: 2 }', Object) // { a: 1, b: 2}
```

### prop(el, key, value)

Set `key` prop/attribute value depending on value type.

* `on*` property can only be a function.
* `onEvt` === `onevt`.
* `style` can only be an object.
* `id` can only be a string.
* Empty strings are considered booleans: `<a disabled />` → `a.props.disabled === true`

### polyfill

Add `props` to all HTML elements by including augment for `Element.prototype.props`:

```js
import 'element-props/augment.js'

document.body.id = 'my-body'
document.body.props // { id: 'my-body' }
```

### Design

Internally uses _Proxy_, (no IE11 support, but in theory possible with  _MutationObserver_ fallback)

Inspired by this [tweet](https://twitter.com/WebReflection/status/1260948278977409026?s=20) with spreading [hint](https://github.com/tc39/proposal-object-rest-spread/issues/69#issuecomment-633232470).

## See also

* [Element properties proposal](https://github.com/developit/unified-element-properties-proposal)
* [templize](https://github.com/spectjs/templize)
* [attr-types](https://github.com/qwtel/attr-types)

## License

ISC © Dmitry Iv.

<p align="center">ॐ</p>
