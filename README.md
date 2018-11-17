# Swagger Mock Server

Yet Another Swagger mock server

# Install

```
yarn add -D yasocks
```

# Usage

```
Usage:
       yasocks /path/to/swagger.json
       yasocks http://example.com/swagger.json
```

# Configuration

```
PORT=8000 yasocks /path/to/swagger.json
```

# Programmatic use

```js
const yasocks = require('yasocks')
yasocks('/path/to/swagger')
```
