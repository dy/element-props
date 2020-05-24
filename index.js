const stash = new WeakMap

export default (el, types) => {
  if (stash.has(el)) return stash.get(el)

  let a = el.attributes, k

  // Array/Object is parsed with JSON.parse
  // FIXME: move to `typed`
  if (types) for (k in types) if (~[Object, Array].indexOf(types[k])) types[k] = JSON.parse

  let p = new Proxy(el.attributes, {
    get: (_,k) =>
      k === Symbol.observable ? observable(el) :
      // k === Symbol.asyncIterator ? asyncIterator(el) :
      k in el ? el[k] :
      a[k] && typed(a[k].value, types && types[k]),
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

  stash.set(el, p)

  return p
}

const observed = new WeakMap()

const observable = el => {
  return () => ({
    subscribe(observer) {
      // MO does not prevent garbage collecting removed node https://dom.spec.whatwg.org/#garbage-collection
      // FIXME: not sure will the MO itself be collected
      if (!observed.has(el)) {
        let mo = new MutationObserver(() => dispatch(el))
        observed.set(el, mo)
        mo.observe(el,{ attributes:true })
      }

      const next = observer.next || observer, handler = e => next(e.detail.props)
      el.addEventListener('props', handler)
      return {
        unsubscribe() { el.removeEventListener('props', handler) }
      }
    },
    [Symbol.observable]() { return this }
  })
}

const dispatch = el => el.dispatchEvent(
  new CustomEvent('props', {
    detail: {
      props: stash.get(el)
    }
  })
)

// const ai = el => {
//   return () => {
//     channel.subscribe(null, null, () => stop = true)
//     let stop
//     ;(async () => {
//       try {
//         for await (source of source) {
//           if (stop) break
//           channel.push(map(source))
//         }
//       } catch(e) {
//         error(e)
//       }
//     })()
//   }
//   unsub = () => stop = true
//   ;(async () => { for await (target of target) { if (stop) break; fn(target) } })()
// }

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
  else return false

  dispatch(el)
  return true
}
