const cached = new WeakMap

export default (el, types) => {
  if (cached.has(el)) return cached.get(el)

  let p = new Proxy(el.attributes, {
    get: (_,k) =>
      k === Symbol.observable ? observable(el) :
      k === Symbol.asyncIterator ? asyncIterable(el) :
      k in el ? el[k] :
      el.hasAttribute(k) && typed(el.getAttribute(k), types && types[k]),

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

  cached.set(el, p)

  return p
}

// auto-parse pkg in a single line (no object/array detection)
// Number(n) is fast: https://jsperf.com/number-vs-plus-vs-toint-vs-tofloat/35
const typed = ( v, t, n ) => (
  t = t === Object || t === Array ? JSON.parse : t,
  v == '' && !t || t === Boolean ? true : t ? t(v) : isNaN(n=Number(v)) ? v : n
)

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

const desc = { enumerable: true, configurable: true }, getOwnPropertyDescriptor = () => desc

const observed = new WeakMap
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

      // immediate value
      next(cached.get(el))

      el.addEventListener('props', handler)
      const unsubscribe = () => el.removeEventListener('props', handler)
      return unsubscribe.unsubscribe = unsubscribe
    },
    [Symbol.observable]() { return this }
  })
}

const asyncIterable = el => {
  return async function*() {
    let resolve, buf = [], p = new Promise(r => resolve = r),
      unsubscribe = cached.get(el)[Symbol.observable]()
      .subscribe(v => ( buf.push(v), resolve(), p = new Promise(r => resolve = r) ))

    try { while (1) yield* buf.splice(0), await p }
    catch {}
    finally { unsubscribe() }
  }
}

const dispatch = el => el.dispatchEvent(new CustomEvent('props', { detail: { props: cached.get(el) }}))
