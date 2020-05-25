import t from 'tst'
import props from './index.js'
import { tick } from 'wait-please'

Symbol.observable = Symbol.observable || Symbol('observable')

t('get/set/spread', t => {
  let el = document.createElement('div')
  el.id = 1
  el.props = props(el)
  el.props.x = 2
  t.is({...el.props}, {x:2,id:"1"})
  t.is(el.props.x, 2)
  t.is(el.x, 2)

  el.setAttribute('y','abc')
  t.is({...el.props}, { x:2, y:'abc', id:"1" })

  el.props.z = 'def'
  t.is({...el.props}, { x:2, y:'abc', z:'def', id:"1" })
})

t('propTypes', t => {
  let el = document.createElement('div')

  el.props = props(el, {n:Number, b:Boolean, o:Object, a:Array, s:String, d:Date})
  el.props.n = '1'
  el.setAttribute('b', '')
  el.props.s = 'abc'
  el.setAttribute('a', '[1,2,3]')
  el.props.o = '{"foo":"bar"}'

  t.is({...el.props}, {n: 1, b: true, s: 'abc', o: {foo:'bar'}, a: [1,2,3]})
  t.is(el.props.n, 1)
  t.is(el.props.b, true)
  t.is(el.props.s, 'abc')
  t.is(el.props.o, {foo: 'bar'})
  t.is(el.props.a, [1,2,3])
})

t('non-attr props', t => {
  let el = document.createElement('div')
  el.x = 1

  el.props = props(el)
  t.is({...el.props}, {x: 1})

  el.y = 1
  t.is(el.y, 1)
  t.is({...el.props}, {x: 1, y: 1})
})

t('observable', async t => {
  let el = document.createElement('div')
  let log = []
  el.props = props(el)
  let unsub = el.props[Symbol.observable]().subscribe(props => log.push({...props}))
  t.is(log, [{}])
  el.props.x = 1
  t.is(log, [{}, {x:1}])
  el.setAttribute('y', 2)
  await tick(2)
  t.is(log, [{}, {x:1}, {x: 1, y: 2}])

  unsub()
  el.props.z = 3
  await tick(3)
  t.is(log, [{}, { x:1 }, { x: 1, y: 2 }])
  el.setAttribute('z', 3)
  await tick(4)
  t.is(log, [{}, { x:1 }, { x: 1, y: 2 }])
})

t('multiple observables do not create multiple events', async t => {
  let el = document.createElement('div')
  let log = []
  el.props = props(el)
  let unsub1 = el.props[Symbol.observable]().subscribe(props => log.push({...props}))
  let unsub2 = el.props[Symbol.observable]().subscribe(props => log.push({...props}))
  t.is(log, [{},{}])
  el.setAttribute('x',1)
  await tick(8)
  t.is(log, [{},{},{x:1},{x:1}])

  unsub1()
  el.setAttribute('x',2)
  await tick(8)
  t.is(log, [{},{},{x:1},{x:1},{x:2}])

  unsub2()
  el.setAttribute('x',3)
  await tick(8)
  t.is(log, [{},{},{x:1},{x:1},{x:2}])
})

t('async iterable', async t => {
  let el = document.createElement('div')
  let log = []
  el.props = props(el)

  let stop = false
  ;(async () => { for await (let props of el.props) {
    if (stop) break
    log.push({...props})
  }})()

  await tick(8)
  t.is(log, [{}])

  el.props.x = 1
  await tick(4)
  t.is(log, [{}, {x:1}])

  el.setAttribute('y', 2)
  await tick(4)
  t.is(log, [{}, {x:1}, {x:1, y:2}])

  stop = true
  await tick(4)
  el.setAttribute('z', 3)
  await tick(4)
  t.is(log, [{}, {x:1}, {x:1, y:2}])
})

t('delete prop', t => {
  let el = document.createElement('div')
  el.props = props(el)
  el.props.x = 1
  t.is(el.props.x, 1)
  delete el.props.x
  t.is(el.props.x, undefined)
})

t('polyfill', async t => {
  await import('./polyfill.js')

  let el = document.createElement('div')
  el.id = 'my-element'

  // preserves value type
  el.props.x = 1
  t.is(el.getAttribute('x'), '1')
  t.is(el.props.x, 1)

  // normalizes boolean attribs
  el.setAttribute('y', '')
  t.is(el.props.y, true)
  el.props.y = false
  t.is(el.getAttribute('y'), null)

  // spread 👌
  t.is({...el.props}, { x: 1, y: false, id: 'my-element' })

  // observe changes
  let log = []
  ;(async () => {
    for await (let props of el.props) log.push({...props})
  })();
  await tick(4)
  t.is(log, [{x:1,y:false,id:'my-element'}])

  document.body.id = 'my-body'
  t.is({...document.body.props}, { id: 'my-body' })
})
