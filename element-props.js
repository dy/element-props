// auto-parse pkg in 2 lines (no object/array detection)
export const parse = ( v, Type ) => (
  Type = Type === Object ? JSON.parse : Type === Array ? s => JSON.parse(s[0]==='['?s:`[${s}]`) : Type,
  v === '' && Type !== String ? true : Type ? Type(v) : !v || isNaN(+v) ? v : +v
),

prop = (el, k, v) => {
  // onClick → onclick, someProp -> some-prop
  if (k.startsWith('on')) k = k.toLowerCase()

  if (el[k] !== v) {
    // avoid readonly props https://jsperf.com/element-own-props-set/1
    // ignoring that: it's too heavy, same time it's fine to throw error for users to avoid setting form
    // let desc; if (!(k in el.constructor.prototype) || !(desc = Object.getOwnPropertyDescriptor(el.constructor.prototype, k)) || desc.set)
    el[k] = v;
  }

  if (v === false || v == null) el.removeAttribute(k)
  else if (typeof v !== 'function') el.setAttribute(dashcase(k),
    v === true ? '' :
    (typeof v === 'number' || typeof v === 'string') ? v :
    (k === 'class') ? (Array.isArray(v) ? v : Object.entries(v).map(([k,v])=>v?k:'')).filter(Boolean).join(' ') :
    (k === 'style') ? Object.entries(v).map(([k,v]) => `${k}: ${v}`).join(';') :
    ''
  )
},

// create input element getter/setter
input = (el) => [
  (el.type === 'checkbox' ? () => el.checked : () => el.value),
  (
    el.type === 'text' || el.type === '' ? value => (el.value = value == null ? '' : value) :
    el.type === 'checkbox' ? value => (el.value = value ? 'on' : '', prop(el, 'checked', value)) :
    el.type === 'select-one' ? value => (
      [...el.options].map(el => el.removeAttribute('selected')),
      el.value = value,
      el.selectedOptions[0]?.setAttribute('selected', '')
    ) :
    value => el.value = value
  )
]

export default (el, types, onchange) => {
  // inputs
  const isInput = (el.tagName === 'INPUT' || el.tagName === 'SELECT'),
    [iget, iset] = input(el),
    p = new Proxy(el.attributes, {
      get: (attrs, k, attr) => (
        isInput && k === 'value' ? iget() :
        // k === 'children' ? [...el.childNodes] :
        k in el ? el[k] : (attr = attrs[dashcase(k)], attr && (attr.call ? attr : parse(attr.value, types?.[k])))
      ),
      set: (attrs, k, v) => (
        isInput && k === 'value' ? iset(v) : prop(el, k, parse(v, types?.[k])),
        onchange?.(k, v, attrs), 1
      ),

      deleteProperty: (_,k,u) => (el.removeAttribute(k), el[k]=u, delete el[k]), // events cannot be deleted, but have to be nullified

      // spread https://github.com/tc39/proposal-object-rest-spread/issues/69#issuecomment-633232470
      getOwnPropertyDescriptor: a => ({ enumerable: true, configurable: true }),
      ownKeys: attrs => Array.from(
        // joined props from element keys and real attributes
        new Set([...Object.keys(el), ...Object.getOwnPropertyNames(attrs)].filter(k => el[k] !== p && isNaN(+k)))
      )
    });

  // normalize initial input.value
  if (isInput) iset(iget())

  return p
}

const el = document.createElement('div')
const dashcase = (str) => {
  el.dataset[str] = ''
  let dashStr = el.attributes[0].name.slice(5)
  delete el.dataset[str]
  return dashStr
}