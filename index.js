const express = require('express')
const faker = require('faker')
const axios = require('axios')
const fs = require('fs')
const logger = require('morgan')

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

const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  )
  res.header('Access-Control-Allow-Methods', 'PUT, PATCH, POST, GET, DELETE, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.status(200).send('ok')
    return
  }

  next()
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

async function start(path) {
  const swagger = await getSwagger(path)

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

  app.use(corsMiddleware)
  app.use(logger('dev'))

  const { paths } = swagger

  Object.keys(swagger.paths).forEach(path => {
    const _res = paths[path]
    const res = (_res.get || _res.post || _res.put || _res.patch || _res.delete).responses
    const code = res['200'] || res['201'] || res['204']
    if (code.schema) {
      const def = refToDef(code.schema.$ref)
      const response = expandedDef[def]
      app.use(path.replace(/\{(.+?)\}/, ':$1'), json(response))
    }
  })

  const port = process.env.PORT || 7205
  app.listen(port, () =>
    console.log(`[yasocks] swgger mock server is listenning to http://localhost:${port}`),
  )
}

module.exports = start
