export default (el, types) => {
  let a = el.attributes, k

  // Array/Object is parsed with JSON.parse
  if (types) for (k in types) if (~[Object, Array].indexOf(types[k])) types[k] = JSON.parse

  let p = new Proxy(el.attributes, {
    get: (_,k) => k in el ? el[k] : a[k] && typed(a[k].value, types && types[k]),
    set: (_, k, v) => set(el, k, v, types && types[k]),

    // spread https://github.com/tc39/proposal-object-rest-spread/issues/69#issuecomment-633232470
    getOwnPropertyDescriptor,

    // joined props from element keys and real attributes
    ownKeys: _ => Array.from(
      new Set(
        Object.keys(el).filter(k => el[k] !== p)
        .concat(Reflect.ownKeys(_).filter(v => isNaN(Number(v))))
      )
    )
  });
  return p
}

// auto-parse pkg in a single line (no object/array detection)
// Number(n) is fast: https://jsperf.com/number-vs-plus-vs-toint-vs-tofloat/35
const typed = (v,t,n) => v == '' && !t || t === Boolean ? true : t ? t(v) : isNaN(n=Number(v)) ? v : n

const desc = { enumerable: true, configurable: true }, getOwnPropertyDescriptor = () => desc

const set = (el, k, v, t) => {
  el[k] = typed(v, t)

  if (!el.setAttribute) return

  if (v === false || v == null) el.removeAttribute(k)
  else if (v === true) el.setAttribute(k, '')
  else if (typeof v === 'number' || typeof v === 'string') el.setAttribute(k, v)
  // class=[a, b, ...c]
  else if (k === 'class' && Array.isArray(v)) el.setAttribute(k, v.filter(Boolean).join(' '))
  // onclick={} - skip
  else if (typeof v === 'function') {}
  // style={}
  else if (k === 'style' && v.constructor === Object)
    el.setAttribute(k,(k=v,v=Object.values(v),Object.keys(k).map((k,i) => `${k}: ${v[i]};`).join(' ')))

  return true
}
