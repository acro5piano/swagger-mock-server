const express = require('express')
const faker = require('faker')
const swagger = require('./swagger')
const axios = require('axios')
const fs = require('fs')

const getMock = type => {
  switch (type) {
    case 'string':
      return faker.lorem.text().slice(0, 20)
    case 'integer':
      return faker.random.number(500)
    case 'boolean':
      return faker.random.boolean()
  }
}

const refToDef = ref => ref.split('/').slice(-1)[0]

const json = json => (_, res) => res.json(json)

const getSwagger = async path =>
  new Promise(resolve => {
    fs.exists(path, res => {
      if (res) {
        resolve(require(`./${path}`))
      } else {
        axios.get(path).then(res => resolve(res.data))
      }
    })
  })

async function start() {
  const swaggerPath = await getSwagger(process.argv[2])

  const definitions = {}
  Object.keys(swagger.definitions).forEach(def => {
    const values = swagger.definitions[def].properties
    definitions[def] = values
  })

  const expandDef = mtd => {
    for (const key in mtd) {
      const type = mtd[key].type
      if (type === 'object' && mtd[key].$ref) {
        const ref = refToDef(mtd[key].$ref)
        mtd[key] = expandDef(definitions[ref])
      } else if (type === 'array') {
        if (mtd[key].items.$ref) {
          const ref = refToDef(mtd[key].items.$ref)
          mtd[key] = [expandDef(definitions[ref])]
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
    expandedDef[key] = expandDef(definitions[key])
  }

  const app = express()

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
}

start()
