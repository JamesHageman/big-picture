import express from 'express'

const app = express();

app.get('/', (req, res) => {
  res.send('foo');
})

export default app
