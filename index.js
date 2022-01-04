export default (el, type={}) => {
  // auto-parse pkg in 2 lines (no object/array detection)
  // Number(n) is fast: https://jsperf.com/number-vs-plus-vs-toint-vs-tofloat/35
  const t = ( v, t ) => (
    t = t === Object || t === Array ? JSON.parse : t,
    v === '' && t !== String ? true : t ? t(v) : !v || isNaN(+v) ? v : +v
  ),

  proto = el.constructor.prototype,

  // inputs
  input = el.tagName === 'INPUT' || el.tagName === 'SELECT',
  iget = input && (el.type === 'checkbox' ? () => el.checked : () => el.value),
  iset = input && (el.type === 'text' ? value => el.value = (value == null ? '' : value) :
    el.type === 'checkbox' ? value => (el.value = (value ? 'on' : ''), p.checked = value) :
    el.type === 'select-one' ? value => (
      [...el.options].map(el => el.removeAttribute('selected')),
      el.value = value,
      el.selectedOptions[0] && el.selectedOptions[0].setAttribute('selected', '')
    ) :
    value => el.value = value
  ),
  p = new Proxy(
    el.attributes,
    {
      get: (a, k) =>
        input && k === 'value' ? iget() :
        // k === 'children' ? [...el.childNodes] :
        k in el ? el[k] : a[k] && (a[k].call ? a[k] : t(a[k].value, type[k])),
      set: (a, k, v, desc) => (
        // input case
        input && k === 'value' ? iset(v) :
        (
          v = t(v, type[k]),
          el[k] !== v &&
          // avoid readonly props https://jsperf.com/element-own-props-set/1
          (!(k in proto) || !(desc = Object.getOwnPropertyDescriptor(proto, k)) || desc.set) && (el[k] = v),
          v === false || v == null ? el.removeAttribute(k) :
          typeof v !== 'function' && el.setAttribute(k,
            v === true ? '' :
            typeof v === 'number' || typeof v === 'string' ? v :
            k === 'class' && Array.isArray(v) ? v.filter(Boolean).join(' ') :
            k === 'style' && v.constructor === Object ?
              (k=v,v=Object.values(v),Object.keys(k).map((k,i) => `${k}: ${v[i]};`).join(' ')) :
            ''
          )
        ),
        el.dispatchEvent(new CustomEvent('prop'))
      ),

      deleteProperty:(a,k) => (el.removeAttribute(k),delete el[k]),

      // spread https://github.com/tc39/proposal-object-rest-spread/issues/69#issuecomment-633232470
      getOwnPropertyDescriptor: _ => ({ enumerable: true, configurable: true }),

      // joined props from element keys and real attributes
      ownKeys: a => Array.from(
        new Set([...Object.keys(el), ...Object.getOwnPropertyNames(a)].filter(k => el[k] !== p && isNaN(+k)))
      )
    }
  )

  if (input) iset(iget())

  return p
}
