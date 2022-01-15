// auto-parse pkg in 2 lines (no object/array detection)
export const parse = ( v, Type ) => (
  Type = Type === Object ? JSON.parse : Type === Array ? s => JSON.parse(s[0]==='['?s:`[${s}]`) : Type,
  v === '' && Type !== String ? true : Type ? Type(v) : !v || isNaN(+v) ? v : +v
),

prop = (el, k, v, desc) => (
  k = k.slice(0,2)==='on' ? k.toLowerCase() : k, // onClick → onclick
  // avoid readonly props https://jsperf.com/element-own-props-set/1
  el[k] !== v && (
    !(k in el.constructor.prototype) || !(desc = Object.getOwnPropertyDescriptor(el.constructor.prototype, k)) || desc.set
  ) && (el[k] = v),
  v === false || v == null ? el.removeAttribute(k) :
  typeof v !== 'function' && el.setAttribute(k,
    v === true ? '' :
    typeof v === 'number' || typeof v === 'string' ? v :
    k === 'class' && Array.isArray(v) ? v.filter(Boolean).join(' ') :
    k === 'style' && v.constructor === Object && (
      k=v, v=Object.values(v), Object.keys(k).map((k,i) => `${k}: ${v[i]};`).join(' ')
    )
  )
)

export default (el, types, onchange) => {
  // FIXME: make more static. Calling that on getter is hard... Not often though but still
  // inputs
  const input = el.tagName === 'INPUT' || el.tagName === 'SELECT',
  iget = input && (el.type === 'checkbox' ? () => el.checked : () => el.value),
  iset = input && (
    el.type === 'text' ? value => el.value = value == null ? '' : value :
    el.type === 'checkbox' ? value => (el.value = value ? 'on' : '', p.checked = value) :
    el.type === 'select-one' ? value => (
      [...el.options].map(el => el.removeAttribute('selected')),
      el.value = value,
      el.selectedOptions[0]?.setAttribute('selected', '')
    ) :
    value => el.value = value
  ),
  p = new Proxy(el.attributes,
    {
      get: (a, k) =>
        input && k === 'value' ? iget() :
        // k === 'children' ? [...el.childNodes] :
        k in el ? el[k] : a[k] && (a[k].call ? a[k] : parse(a[k].value, types?.[k])),
      set: (a, k, v) => (
        input && k === 'value' ? iset(v) : prop(el, k, parse(v, types?.[k])),
        onchange?.(k, v, a), 1
      ),

      deleteProperty: (a,k,u) => (el.removeAttribute(k), el[k]=u, delete el[k]), // events cannot be deleted, but have to be nullified

      // spread https://github.com/tc39/proposal-object-rest-spread/issues/69#issuecomment-633232470
      getOwnPropertyDescriptor: a => ({ enumerable: true, configurable: true }),
      ownKeys: a => Array.from(
        // joined props from element keys and real attributes
        new Set([...Object.keys(el), ...Object.getOwnPropertyNames(a)].filter(k => el[k] !== p && isNaN(+k)))
      )
    }
  )

  // normalize initial input.value
  if (input) iset(iget())

  return p
}
