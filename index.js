const express = require('express')
const app = express()
const port = 8002

app.get('/', (req, res) => {
  res.send('Hello World! from tenants API')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

