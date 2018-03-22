const tape = require('tape')
const crypto = require('crypto')
const level = require('level-browserify')
const RadixTree = require('../')
const db = level('./testdb')

tape.only('set and get', async t => {
  let tree = new RadixTree({
    db: db
  })
  const stateRoot = await tree.flush()
  console.log(stateRoot)
  const stateRoot2 = await tree.flush()
  console.log(stateRoot2)
  t.end()
})

tape('set and get', async t => {
  const r = await RadixTree.getMerkleLink(Buffer.from([0]))

  t.equal(r.toString('hex'), '6e340b9cffb37a989ca544e6bb780a2c78901d3f', 'should hash')

  let tree = new RadixTree({
    db: db
  })

  tree.set('test', Buffer.from('cat'))
  let val = await tree.get('test')
  t.equals(val.value.toString(), 'cat')
  tree.set('te', Buffer.from('blop'))
  val = await tree.get('test')
  t.equals(val.value.toString(), 'cat')

  val = await tree.get('te')
  t.equals(val.value.toString(), 'blop')

  tree.set('rad', Buffer.from('cat2'))

  val = await tree.get('rad')
  t.equals(val.value.toString(), 'cat2')

  tree.set('test', Buffer.from('cat111'))
  val = await tree.get('test')
  t.equals(val.value.toString(), 'cat111')

  const stateRoot = await tree.flush()

  // try reteriving node from ipfs
  tree = new RadixTree({
    db: db,
    root: stateRoot
  })

  val = await tree.get('te')
  t.equals(val.value.toString(), 'blop')

  val = await tree.get('rad')
  t.equals(val.value.toString(), 'cat2')

  val = await tree.get('test')
  t.equals(val.value.toString(), 'cat111')
  // console.log(JSON.stringify(tree.root, null, 2))
  t.end()
})

tape('branch nodes', async t => {
  const tree = new RadixTree({
    db: db
  })

  let key0 = new RadixTree.ArrayConstructor([1, 1])
  let key1 = new RadixTree.ArrayConstructor([0, 1])
  let key2 = new RadixTree.ArrayConstructor([1, 0])
  let key3 = new RadixTree.ArrayConstructor([0, 0])

  tree.set(key0, Buffer.from('cat'))
  tree.set(key1, Buffer.from('cat2'))
  tree.set(key2, Buffer.from('cat'))
  tree.set(key3, Buffer.from('cat3'))

  let val = await tree.get(key0)
  t.equals(val.value.toString(), 'cat')
  val = await tree.get(key1)
  t.equals(val.value.toString(), 'cat2')
  val = await tree.get(key2)
  t.equals(val.value.toString(), 'cat')
  val = await tree.get(key3)
  t.equals(val.value.toString(), 'cat3')

  t.end()
})

tape('delete', async t => {
  const tree = new RadixTree({
    db: db
  })
  tree.set('test', Buffer.from('cat'))
  tree.set('ter', Buffer.from('cat3'))
  tree.delete('te')
  tree.delete('test')
  await tree.delete('ter')
  t.deepEquals(tree.root['/'], RadixTree.emptyTreeState)

  // tests delete midle branchs
  tree.set('test', Buffer.from('cat'))
  tree.set('te', Buffer.from('cat2'))
  tree.set('ter', Buffer.from('cat3'))
  await tree.delete('te')
  let val = await tree.get('test')
  t.equals(val.value.toString(), 'cat')

  // tests delete end branchs
  tree.set('te', 'cat2')
  tree.delete('ter')
  tree.delete('te')
  await tree.delete('test')
  t.deepEquals(tree.root['/'], RadixTree.emptyTreeState)
  t.end()
})

tape('large values', async t => {
  const tree = new RadixTree({
    db: db
  })
  const saved = Buffer.alloc(33).fill(1)
  tree.set('test', saved)
  const value = await tree.get('test')
  t.equals(value.value.toString(), saved.toString())
  t.end()
})

tape('errors', async t => {
  const tree = new RadixTree({
    db: db,
    root: {
      '/': Buffer.alloc(20)
    }
  })

  try {
    await tree.get('test')
  } catch (e) {
    t.end()
  }
})

tape('random', async t => {
  const tree = new RadixTree({
    db: db
  })
  const entries = 100
  for (let i = 0; i < entries; i++) {
    const key = crypto.createHash('sha256').update(i.toString()).digest().slice(0, 20)
    tree.set(key, Buffer.from([i]))
  }
  // console.log(JSON.stringify(tree.root, null, 2))

  await tree.flush()

  for (let i = 0; i < entries; i++) {
    const key = crypto.createHash('sha256').update(i.toString()).digest().slice(0, 20)
    const value = await tree.get(key)
    t.equals(value.value[0], i)
  }

  await tree.flush()
  for (let i = 0; i < entries; i++) {
    const key = crypto.createHash('sha256').update(i.toString()).digest().slice(0, 20)
    await tree.delete(key)
  }

  t.deepEquals(tree.root['/'], RadixTree.emptyTreeState)

  t.end()
})
