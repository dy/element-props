// polyfill Element.prototype.props
import props from './index.js'

const cache = new WeakMap
Object.defineProperty(Element.prototype, 'props', {
  get() {
    let p = cache.get(this)
    if (!p) cache.set(this, p = props(this))
    return p
  }
})
