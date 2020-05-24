export default (el, types) => {
  let a = el.attributes, p = new Proxy(a, {
    get: (_,k) =>
      k === Symbol.observable ? observable(el, p) :
      k === Symbol.asyncIterator ? asyncIterable(el, p) :
      k in el ? el[k] :
      a[k] && typed(a[k].value, types && types[k]),
    set: (_, k, v) => set(el, p, k, v, types && types[k]),

    // spread https://github.com/tc39/proposal-object-rest-spread/issues/69#issuecomment-633232470
    getOwnPropertyDescriptor,

    // joined props from element keys and real attributes
    ownKeys: _ => Array.from(
      new Set(
        Object.keys(el).filter(k => el[k] !== p)
        .concat(Object.getOwnPropertyNames(_).filter(v => isNaN(Number(v))))
      )
    )
  });

  return p
}

// auto-parse pkg in 2 lines (no object/array detection)
// Number(n) is fast: https://jsperf.com/number-vs-plus-vs-toint-vs-tofloat/35
const typed = ( v, t, n ) => (
  t = t === Object || t === Array ? JSON.parse : t,
  v == '' && !t || t === Boolean ? true : t ? t(v) : isNaN(n=Number(v)) ? v : n
)

const set = (el, props, k, v, t) => {
  el[k] = typed(v, t)

  if (el.setAttribute) {
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
    else return true

    dispatch(el, props)
  }

  return true
}

const desc = { enumerable: true, configurable: true }, getOwnPropertyDescriptor = () => desc

const observed = new WeakMap
const observable = (el, props) => {
  return () => ({
    subscribe(observer) {
      // MO does not prevent garbage collecting removed node https://dom.spec.whatwg.org/#garbage-collection
      // FIXME: not sure will the MO itself be collected
      if (!observed.has(el)) {
        let mo = new MutationObserver(() => dispatch(el, props))
        observed.set(el, mo)
        mo.observe(el,{ attributes:true })
      }

      const next = observer.next || observer, handler = e => next(e.detail.props)

      // immediate value
      next(props)

      el.addEventListener('props', handler)
      const unsubscribe = () => el.removeEventListener('props', handler)
      return unsubscribe.unsubscribe = unsubscribe
    },
    [Symbol.observable]() { return this }
  })
}

const asyncIterable = (el, props) => {
  return async function*() {
    let resolve, buf = [], p = new Promise(r => resolve = r),
      unsubscribe = props[Symbol.observable]().subscribe(v => ( buf.push(v), resolve(), p = new Promise(r => resolve = r) ))

    try { while (1) yield* buf.splice(0), await p }
    catch {}
    finally { unsubscribe() }
  }
}

const dispatch = (el, props) => el.dispatchEvent(new CustomEvent('props', { detail: { props }}))
