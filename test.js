import t from 'tst'
import props from './'

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

t('observable', t => {

})

t('async iterable', t => {

})
