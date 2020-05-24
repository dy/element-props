import t from 'tst'
import p from './'

t('get/set/spread', t => {
  let el = document.createElement('div')
  el.id = 1
  el.props = p(el)
  el.props.x = 2
  t.is({...el.props}, {x:2,id:"1"})
  t.is(el.props.x, 2)
  t.is(el.x, 2)

  el.setAttribute('y','abc')
  t.is({...el.props}, { x:2, y:'abc', id:"1" })

  el.props.z = 'def'
  t.is({...el.props}, { x:2, y:'abc', z:'def', id:"1" })
})

t('observable', t => {

})

t('async iterable', t => {

})
