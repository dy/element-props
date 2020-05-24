const hasProxy = typeof Proxy !== 'undefined'

// auto-parse pkg in a single line :) (no object/array detection)
// Number(n) is fast: https://jsperf.com/number-vs-plus-vs-toint-vs-tofloat/35
const Auto = (v,n) => v == '' ? true : isNaN(n=Number(v)) ? v : n

// const stash = new WeakMap

export default (el, types) => {
  let a = el.attributes, k

  // Array/Object is parsed with JSON.parse
  if (types) for (k in types) if (~[Object, Array].indexOf(types[k])) types[k] = JSON.parse

  const get = (_,k) => k in el ? el[k] : a[k] && (types && types[k] || Auto)(a[k].value)

  // IE11
  // enumerate props
  // if (!types) { types = {}; for (a of a) types[a.name] = Auto; Object.keys(el).map(k => types[k] = el[k].constructor); }
  // if (!hasProxy) {
  //   let props = stash.get(el)
  //   if (!props) {
  //     props={...el}
  //     // read existing props
  //     for (a of a) props[a.name] = get(el,a.name)
  //     stash.set(el, props)
  //   }
  //   new MutationObserver(l=>l.map(({attributeName:k}) => el[k]=props[k]=get(el,k)))
  //     .observe(el,{attributes:true})
  //   Object.defineProperty(el, 'props', {
  //     get(){
  //       Object.assign(props, {...this})
  //     }
  //   })
  //   return props
  // }

  return new Proxy(el.attributes, {
    get,
    set: (_, k, v) => set(el, k, v),
    // spread https://github.com/tc39/proposal-object-rest-spread/issues/69#issuecomment-633232470
    getOwnPropertyDescriptor(target, name) {
      const pd = Reflect.getOwnPropertyDescriptor(target, name)
      pd.enumerable = !pd.enumerable
      return pd
    }
  });
}

const set = (el, k, v) => {
  el[k] = v

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
