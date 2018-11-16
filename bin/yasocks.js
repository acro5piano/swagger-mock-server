#!/usr/bin/env node

'use strict'

if (!process.argv[2]) {
  console.log('Fatal: no swagger file given')
  console.log()
  console.log('Usage:')
  console.log('       yasocks /path/to/swagger.json')
  console.log('       yasocks http://example.com/swagger.json')
  process.exit(1)
}

require('../')()
