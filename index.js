export default (el, pt={}, p,
  // auto-parse pkg in 2 lines (no object/array detection)
  // Number(n) is fast: https://jsperf.com/number-vs-plus-vs-toint-vs-tofloat/35
  t = ( v, t ) => (
    t = t === Object || t === Array ? JSON.parse : t,
    v == '' && t !== String ? true : t ? t(v) : isNaN(t=Number(v)) ? v : t
  ),

  d = el => el.dispatchEvent(new CustomEvent('props')),

  // define symbols on attributes
  a = Object.assign(el.attributes, {
    async *[Symbol.asyncIterator]() {
      let resolve, buf = [], p = new Promise(r => resolve = r),
        unsub = a[Symbol.observable]().subscribe(v => ( buf.push(v), resolve(), p = new Promise(r => resolve = r) ))

      try { while (1) yield* buf.splice(0), await p }
      catch {}
      finally { unsub() }
    },
    // polyfill observable symbol
    [Symbol.observable||(Symbol.observable=Symbol('observable'))]: () => ({
        // MO does not prevent garbage collecting removed node https://dom.spec.whatwg.org/#garbage-collection
      subscribe:(n, mo=new MutationObserver(() => d(el)), u=()=>(el.removeEventListener('props', n), mo.disconnect())) => (
        mo.observe(el, {attributes:true}),
        (n=(n.next||n).bind(null, p))(),
        el.addEventListener('props', n),
        u.unsubscribe = u
      ),
      [Symbol.observable]() { return this }
    })
  })
) => p = new Proxy(a, {
  get: (_,k) => k in el ? el[k] : a[k] && (a[k].call ? a[k] : t(a[k].value, pt[k])),
  set: (_, k, v) => (
    el[k] = t(v, pt[k]),
    v === false || v == null ? el.removeAttribute(k) :
    el.setAttribute(k,
      v === true ? '' :
      typeof v === 'number' || typeof v === 'string' ? v :
      k === 'class' && Array.isArray(v) ? v.filter(Boolean).join(' ') :
      k === 'style' && v.constructor === Object ?
        (k=v,v=Object.values(v),Object.keys(k).map((k,i) => `${k}: ${v[i]};`).join(' ')) :
      ''
    ),
    d(el)
  ),

  // spread https://github.com/tc39/proposal-object-rest-spread/issues/69#issuecomment-633232470
  getOwnPropertyDescriptor: _ => ({ enumerable: true, configurable: true }),

  // joined props from element keys and real attributes
  ownKeys: _ => Array.from(
    new Set([...Object.keys(el), ...Object.getOwnPropertyNames(a)].filter(k => el[k] !== p && isNaN(Number(k))))
  )
})
