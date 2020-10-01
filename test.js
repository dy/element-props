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

t.skip('observable', async t => {
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

t.skip('multiple observables do not create multiple events', async t => {
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

t.skip('async iterable', async t => {
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

t('set function, get function', t => {
  let el = document.createElement('a'), log = []
  el.props = props(el)
  el.props.onclick = () => log.push(1)
  el.click()
  // el.dispatchEvent(new MouseEvent('click'))
  t.is(log, [1])

  // el.props.onClick = () => log.push(2)
  // el.click()
  // t.is(log, [1, 2])
})

t('readonly attribs', t => {
  let f = document.createElement('form')
  f.id = 'x'
  f.innerHTML = '<button/>'
  f.firstChild.props = props(f.firstChild)
  f.firstChild.props.form = 'x'
  t.is(f.firstChild.form, f)
})

// input
t.todo('input: play around', async t => {
  let el = document.createElement('input')
  document.body.appendChild(el)
  el.props = props(el)
  el.props[Symbol.observable]().subscribe(v => console.log(v))

  let cb = document.createElement('input')
  cb.setAttribute('type', 'checkbox')
  document.body.appendChild(cb)
  let bool = i(cb)
  bool(v => console.log(v))

  let sel = document.createElement('select')
  sel.innerHTML = `<option value=1>A</option><option value=2>B</option>`
  document.body.appendChild(sel)
  let enm = i(sel)
  enm(v => console.log(v))
})
t.skip('input: notifies direct changing value', async t => {
  let el = document.createElement('input')
  el.props = props(el)
  el.value = 0
  t.is(el.props.value, '0')

  // observer 1
  let log = []
  el.props[Symbol.observable]().subscribe(({value}) => log.push(value))

  t.is(log, ['0'], 'initial value notification')

  el.focus()
  el.dispatchEvent(new Event('focus'))
  el.value = 1
  el.dispatchEvent(new Event('change'))
  await tick()
  el.value = 2
  el.dispatchEvent(new Event('change'))
  await tick()
  el.value = 3
  el.dispatchEvent(new Event('change'))
  el.value = 4
  el.dispatchEvent(new Event('change'))
  el.value = 5
  el.dispatchEvent(new Event('change'))
  await tick(8)
  t.is(log.slice(-1), ['5'], 'updates to latest value')
  t.is(el.props.value, '5')

  el.value = 6
  el.dispatchEvent(new Event('change'))
  t.is(el.value, '6', 'reading value')
  await tick(8)
  t.is(log.slice(-1), ['6'], 'reading has no side-effects')
  t.is(el.props.value, '6')
})
t('input: get/set', async t => {
  let el = document.createElement('input')
  el.props = props(el)
  el.props.value = 0
  t.is(el.value, '0', 'set is ok')
  t.is(el.props.value, '0', 'get is ok')
  await tick(8)
  t.is(el.value, '0', 'set is ok')
  t.is(el.props.value, '0', 'get is ok')
})
t('input: input checkbox', async t => {
  let el = document.createElement('input')
  el.type = 'checkbox'
  document.body.appendChild(el)
  el.props = props(el)
  t.is(el.props.value, false)
  t.is(el.checked, false)
  t.is(el.value, '')

  // NOTE: changing checked does not update value
  // el.checked = true
  // el.dispatchEvent(new Event('change'))
  el.props.value = true
  t.is(el.props.value, true)
  t.is(el.checked, true)
  t.is(el.value, 'on')

  el.props.value = false
  t.is(el.props.value, false)
  t.is(el.checked, false)
  t.is(el.value, '')
})
t.browser('input: select', async t => {
  let el = document.createElement('select')
  el.innerHTML = '<option value=1 selected>A</option><option value=2>B</option>'
  // document.body.appendChild(el)
  el.props = props(el)
  t.is(el.props.value, '1')
  t.is(el.value, '1')

  el.props.value = '2'
  // el.dispatchEvent(new Event('change'))
  t.is(el.props.value, '2')
  t.is(el.value, '2')
  t.is(el.innerHTML, '<option value="1">A</option><option value="2" selected="">B</option>')

  el.props.value = '1'
  t.is(el.props.value, '1')
  t.is(el.innerHTML, '<option value="1" selected="">A</option><option value="2">B</option>')
  t.is(el.value, '1')

  // FIXME: broken in jsdom
  el.props.value = null
  t.is(el.value, '')
  t.is(el.props.value, '')
  t.is(el.innerHTML, '<option value="1">A</option><option value="2">B</option>')
  t.is(el.value, '')
})
t.todo('input: input radio')
t.todo('input: input range')
t.todo('input: input date')
t.todo('input: input multiselect')

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
  // let log = []
  // ;(async () => {
  //   for await (let props of el.props) log.push({...props})
  // })();
  // await tick(4)
  // t.is(log, [{x:1,y:false,id:'my-element'}])

  document.body.id = 'my-body'
  t.is({...document.body.props}, { id: 'my-body' })
})
