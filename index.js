const express = require('express')
const swagger = require('./swagger')

const definitions = {}
Object.keys(swagger.definitions).forEach(def => {
  const values = swagger.definitions[def].properties
  definitions[def] = values
})

const getMock = type => {
  switch (type) {
    case 'string':
      return 'hello'
    case 'integer':
      return 123
    case 'boolean':
      return false
  }
}

const refToDef = ref => ref.split('/').slice(-1)[0]

const expand = mtd => {
  for (const key in mtd) {
    const type = mtd[key].type
    if (type === 'object' && mtd[key].$ref) {
      const ref = mtd[key].$ref.split('/').slice(-1)[0]
      mtd[key] = expand(definitions[ref])
    } else if (type === 'array') {
      if (mtd[key].items.$ref) {
        const ref = mtd[key].items.$ref.split('/').slice(-1)[0]
        mtd[key] = [expand(definitions[ref])]
      } else {
        mtd[key] = getMock(mtd[key].items.type)
      }
    } else if (type) {
      mtd[key] = getMock(type)
    }
  }
  return mtd
}

const expandedDef = {}
for (const key in definitions) {
  expandedDef[key] = expand(definitions[key])
}

const app = express()

const json = json => (_, res) => res.json(json)

const { paths } = swagger

Object.keys(swagger.paths).forEach(path => {
  const _res = paths[path]
  const res = (_res.get || _res.post || _res.put || _res.patch || _res.delete).responses
  const code = res['200'] || res['201'] || res['204']
  if (code.schema) {
    const def = refToDef(code.schema.$ref)
    const response = expandedDef[def]
    app.use(path, json(response))
  }
})

const port = process.env.PORT || 7205
app.listen(port, () => console.log(`mock server listen to http://localhost:${port}`))
