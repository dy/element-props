// polyfill Element.prototype.props
import props from './element-props.js'

const cache = new WeakMap
Object.defineProperty(Element.prototype, 'props', {
  get(p = cache.get(this)) {
    return p || (cache.set(this, p = props(this)), p)
  }
})
