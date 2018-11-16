#!/usr/bin/env node

'use strict'

const path = process.argv[2]

if (!path) {
  console.log('Fatal: no swagger file given')
  console.log()
  console.log('Usage:')
  console.log('       yasocks /path/to/swagger.json')
  console.log('       yasocks http://example.com/swagger.json')
  process.exit(1)
}

const yasocks = require('../')
yasocks(path)
