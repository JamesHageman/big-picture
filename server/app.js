import express from 'express'
import fs from 'fs'
import path from 'path'
import crop from './crop'

const app = express();

app.use(express.static('/public'))

app.get('/', (req, res) => {
  res.send('foo')
})

app.get('/picture', (req, res) => {
  let {
    file,
    x,
    y,
    size
  } = req.query;

  x = parseInt(x, 10);
  y = parseInt(y, 10);
  size = parseInt(size, 10);

  const imageFile = path.join(__dirname, '/img/', file);

  fs.readFile(imageFile, (err, buf) => {
    if (err) throw err;

    crop({
      buf,
      x: x,
      y: x,
      size: size,
      cb: (err, newBuf) => {
        if (err) throw err;

        res.setHeader('Content-Type', 'image/jpg')
        res.send(newBuf)
      }
    })
  })
})

export default app
