export default (el, types) => {
  let a = el.attributes, p = new Proxy(a, {
    get: (_,k) =>
      k === Symbol.observable ? observable(el, p) :
      k === Symbol.asyncIterator ? asyncIterator(el, p) :
      k in el ? el[k] :
      a[k] && typed(a[k].value, types && types[k]),

    set: (_, k, v) => {
      el[k] = typed(v, types && types[k])

      if (v === false || v == null) el.removeAttribute(k)
      else el.setAttribute(k,
        v === true ? '' :
        typeof v === 'number' || typeof v === 'string' ? v :
        k === 'class' && Array.isArray(v) ? v.filter(Boolean).join(' ') :
        k === 'style' && v.constructor === Object ?
          (k=v,v=Object.values(v),Object.keys(k).map((k,i) => `${k}: ${v[i]};`).join(' ')) :
        ''
      )
      dispatch(el, p)

      return true
    },

    // spread https://github.com/tc39/proposal-object-rest-spread/issues/69#issuecomment-633232470
    getOwnPropertyDescriptor: () => desc,

    // joined props from element keys and real attributes
    ownKeys: _ => Array.from(
      new Set([...Object.keys(el), ...Object.getOwnPropertyNames(_)].filter(k => el[k] !== p && isNaN(Number(k))))
    )
  });

  return p
}

const desc = { enumerable: true, configurable: true }

// auto-parse pkg in 2 lines (no object/array detection)
// Number(n) is fast: https://jsperf.com/number-vs-plus-vs-toint-vs-tofloat/35
const typed = ( v, t, n ) => (
  t = t === Object || t === Array ? JSON.parse : t,
  v == '' && !t || t === Boolean ? true : t ? t(v) : isNaN(n=Number(v)) ? v : n
)

const observable = (el, props) => () => ({
  subscribe(next=next.next||next) {
    // MO does not prevent garbage collecting removed node https://dom.spec.whatwg.org/#garbage-collection
    const enext = e => next(e.detail.props),
      mo = new MutationObserver(() => dispatch(el, props)),
      unsub = () => (el.removeEventListener('props', enext), mo.disconnect())

    mo.observe(el,{ attributes:true }), next(props), el.addEventListener('props', enext)
    return unsub.unsubscribe = unsub
  },
  [Symbol.observable]() { return this }
})

const asyncIterator = (el, props) => async function*() {
  let resolve, buf = [], p = new Promise(r => resolve = r),
    unsub = props[Symbol.observable]().subscribe(v => ( buf.push(v), resolve(), p = new Promise(r => resolve = r) ))

  try { while (1) yield* buf.splice(0), await p }
  catch {}
  finally { unsub() }
}

const dispatch = (el, props) => el.dispatchEvent(new CustomEvent('props', { detail: { props }}))
