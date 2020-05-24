const hasProxy = typeof Proxy !== 'undefined'

// auto-parse pkg in a single line :) (no object/array detection)
// Number(n) is fast: https://jsperf.com/number-vs-plus-vs-toint-vs-tofloat/35
const Auto = (v,n) => v == '' ? true : isNaN(n=Number(v)) ? v : n

export default (el, types) => {
  let a = el.attributes, k

  // Array/Object is parsed with JSON.parse
  if (types) for (k in types) if (~[Object, Array].indexOf(types[k])) types[k] = JSON.parse

  // read initial props as attributes
  // Object.keys(el).map(k => !a[k] && set(el, k, el[k], types ? types[k] : el[k].constructor));

  const get = (_,k) => k in el ? el[k] : a[k] && (types && types[k] || Auto)(a[k].value == '' ? true : a[k].value)

  // TODO: IE11
  // if (!hasProxy) {
  //   new MutationObserver(l=>l.map(({attributeName:k}) => el[k]=props[k]=get(el,k)))
  //     .observe(el,{attributes:true})
  //   Object.defineProperty(el, 'props', {
  //     get(){ Object.assign(props, {...this}) }
  //   })
  //   return props
  // }

  let p = new Proxy(el.attributes, {
    get,
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

const desc = { enumerable: true, configurable: true }, getOwnPropertyDescriptor = () => desc

const set = (el, k, v, type=Auto) => {
  el[k] = type(v)

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
