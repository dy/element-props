import t, {is, ok, throws} from './node_modules/tst/tst.js'
import props from './element-props.js'
import { tick } from './node_modules/wait-please/index.js'

Symbol.observable = Symbol.observable || Symbol('observable')

t('get/set/spread', t => {
  let el = document.createElement('div')
  el.id = 1
  el.props = props(el)
  el.props.x = 2
  is({...el.props}, {x:2,id:"1"})
  is(el.props.x, 2)
  is(el.x, 2)

  el.setAttribute('y','abc')
  is({...el.props}, { x:2, y:'abc', id:"1" })

  el.props.z = 'def'
  is({...el.props}, { x:2, y:'abc', z:'def', id:"1" })

})

t('class', t => {
  let el = document.createElement('div')
  el.props = props(el)
  el.props.class = ['a','b','c']
  is(el.className, 'a b c')

  el.props.class = 'a b c d'
  is(el.className, 'a b c d')

  el.props.class = {a:true, b:false, c:true}
  is(el.className, 'a c')
})

t('propTypes', t => {
  let el = document.createElement('div')

  el.props = props(el, {n:Number, b:Boolean, o:Object, a:Array, s:String, d:Date, a2:Array})
  el.props.n = '1'
  el.setAttribute('b', '')
  el.props.s = 'abc'
  el.setAttribute('a', '[1,2,3]')
  el.props.o = '{"foo":"bar"}'
  el.setAttribute('a2', '1,2,3')

  is({...el.props}, {n: 1, b: true, s: 'abc', o: {foo:'bar'}, a: [1,2,3], a2: [1,2,3]})
  is(el.props.n, 1)
  is(el.props.b, true)
  is(el.props.s, 'abc')
  is(el.props.o, {foo: 'bar'})
  is(el.props.a, [1,2,3])
  is(el.props.a2, [1,2,3])
})

t('non-attr props', t => {
  let el = document.createElement('div')
  el.x = 1

  el.props = props(el)
  is({...el.props}, {x: 1})

  el.y = 1
  is(el.y, 1)
  is({...el.props}, {x: 1, y: 1})
})

t('onchange event', async t => {
  let el = document.createElement('div')
  let log = []
  el.props = props(el, null, (k, v) => console.log(k,v)||log.push({[k]: v}))
  is(log, [])
  el.props.x = 1
  is(log, [{x:1}])
})

t.skip('observable', async t => {
  let el = document.createElement('div')
  let log = []
  el.props = props(el)
  let unsub = el.props[Symbol.observable]().subscribe(props => log.push({...props}))
  is(log, [{}])
  el.props.x = 1
  is(log, [{}, {x:1}])
  el.setAttribute('y', 2)
  await tick(2)
  is(log, [{}, {x:1}, {x: 1, y: 2}])

  unsub()
  el.props.z = 3
  await tick(3)
  is(log, [{}, { x:1 }, { x: 1, y: 2 }])
  el.setAttribute('z', 3)
  await tick(4)
  is(log, [{}, { x:1 }, { x: 1, y: 2 }])
})

t.skip('multiple observables do not create multiple events', async t => {
  let el = document.createElement('div')
  let log = []
  el.props = props(el)
  let unsub1 = el.props[Symbol.observable]().subscribe(props => log.push({...props}))
  let unsub2 = el.props[Symbol.observable]().subscribe(props => log.push({...props}))
  is(log, [{},{}])
  el.setAttribute('x',1)
  await tick(8)
  is(log, [{},{},{x:1},{x:1}])

  unsub1()
  el.setAttribute('x',2)
  await tick(8)
  is(log, [{},{},{x:1},{x:1},{x:2}])

  unsub2()
  el.setAttribute('x',3)
  await tick(8)
  is(log, [{},{},{x:1},{x:1},{x:2}])
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
  is(log, [{}])

  el.props.x = 1
  await tick(4)
  is(log, [{}, {x:1}])

  el.setAttribute('y', 2)
  await tick(4)
  is(log, [{}, {x:1}, {x:1, y:2}])

  stop = true
  await tick(4)
  el.setAttribute('z', 3)
  await tick(4)
  is(log, [{}, {x:1}, {x:1, y:2}])
})

t('delete prop', t => {
  let el = document.createElement('div')
  el.props = props(el)
  el.props.x = 1
  is(el.props.x, 1)
  delete el.props.x
  is(el.props.x, undefined)
})

t('set function, get function', t => {
  let el = document.createElement('a'), log = []
  el.props = props(el)
  el.props.onclick = () => log.push(1)
  el.click()
  // el.dispatchEvent(new MouseEvent('click'))
  is(log, [1])

  el.props.onClick = () => log.push(2)
  el.click()
  is(log, [1, 2])
})

t('readonly attribs', t => {
  let f = document.createElement('form')
  f.id = 'x'
  f.innerHTML = '<button/>'
  f.firstChild.props = props(f.firstChild)
  f.firstChild.props.form = 'x'
  is(f.firstChild.form, f)
})

t('function', t => {
  let log = []
  let el = document.createElement('div')
  el.props = props(el)
  el.props.onA = () => {log.push('A')}
  el.ona()

  is(log, ['A'])

  el.props.onb = () => {log.push('b')}
  el.onb()
  is(log, ['A', 'b'])

  el.props.onclick = () => {log.push('click')}
  el.click()
  is(log, ['A','b','click'])

  delete el.props.onclick
  el.click()
  is(log, ['A','b','click'])
})

t('style', t => {
  let el = document.createElement('div')
  el.props = props(el)

  el.props.style = {top:'1px'}
  is(el.style.top, '1px')

  el.props.style = `top: 2px`
  is(el.style.top, '2px')
})

t('unknown type', t => {
  let el = document.createElement('div')
  el.props = props(el)

  el.props.x = {x:1}
  is(el.getAttribute('x'), '')
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
  is(el.props.value, '0')

  // observer 1
  let log = []
  el.props[Symbol.observable]().subscribe(({value}) => log.push(value))

  is(log, ['0'], 'initial value notification')

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
  is(log.slice(-1), ['5'], 'updates to latest value')
  is(el.props.value, '5')

  el.value = 6
  el.dispatchEvent(new Event('change'))
  is(el.value, '6', 'reading value')
  await tick(8)
  is(log.slice(-1), ['6'], 'reading has no side-effects')
  is(el.props.value, '6')
})
t('input: get/set', async t => {
  let el = document.createElement('input')
  el.props = props(el)
  el.props.value = 0
  is(el.value, '0', 'set is ok')
  is(el.props.value, '0', 'get is ok')
  await tick(8)
  is(el.value, '0', 'set is ok')
  is(el.props.value, '0', 'get is ok')
})
t('input: input checkbox', async t => {
  let el = document.createElement('input')
  el.type = 'checkbox'
  document.body.appendChild(el)
  el.props = props(el)
  is(el.props.value, false)
  is(el.checked, false)
  is(el.value, '')

  // NOTE: changing checked does not update value
  // el.checked = true
  // el.dispatchEvent(new Event('change'))
  el.props.value = true
  is(el.props.value, true)
  is(el.checked, true)
  is(el.value, 'on')

  el.props.value = false
  is(el.props.value, false)
  is(el.checked, false)
  is(el.value, '')
})
t.browser('input: select', async t => {
  let el = document.createElement('select')
  el.innerHTML = '<option value=1 selected>A</option><option value=2>B</option>'
  // document.body.appendChild(el)
  el.props = props(el)
  is(el.props.value, '1')
  is(el.value, '1')

  el.props.value = '2'
  // el.dispatchEvent(new Event('change'))
  is(el.props.value, '2')
  is(el.value, '2')
  is(el.innerHTML, '<option value="1">A</option><option value="2" selected="">B</option>')

  el.props.value = '1'
  is(el.props.value, '1')
  is(el.innerHTML, '<option value="1" selected="">A</option><option value="2">B</option>')
  is(el.value, '1')

  // FIXME: broken in jsdom
  el.props.value = null
  is(el.value, '')
  is(el.props.value, '')
  is(el.innerHTML, '<option value="1">A</option><option value="2">B</option>')
  is(el.value, '')
})
t.todo('input: input radio')
t.todo('input: input range')
t.todo('input: input date')
t.todo('input: input multiselect')

// cases
t.skip('template parts', t => {
  let el = document.createElement('div')
  el.props = props(el)
  el.props.onclick = '{{ inc() }}'
  ok(el.onclick)
  is(el.props.onclick, '{{ inc() }}')
})

t('polyfill', async t => {
  await import('./polyfill.js')

  let el = document.createElement('div')
  el.id = 'my-element'

  // preserves value type
  el.props.x = 1
  is(el.getAttribute('x'), '1')
  is(el.props.x, 1)

  // normalizes boolean attribs
  el.setAttribute('y', '')
  is(el.props.y, true)
  el.props.y = false
  is(el.getAttribute('y'), null)

  // spread 👌
  is({...el.props}, { x: 1, y: false, id: 'my-element' })

  // observe changes
  // let log = []
  // ;(async () => {
  //   for await (let props of el.props) log.push({...props})
  // })();
  // await tick(4)
  // is(log, [{x:1,y:false,id:'my-element'}])

  document.body.id = 'my-body'
  is({...document.body.props}, { id: 'my-body' })
})
