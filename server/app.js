import express from 'express'
import fs from 'fs'
import path from 'path'
import crop from './crop'

import Image from './models/Image'
import Picture from './models/Picture'

const app = express();

app.use(express.static('/public'))

app.get('/images', (req, res) => {
  Image.find()
    .exec((err, data) => res.json(data))
})

app.get('/image', (req, res) => {
  let {
    id,
    x,
    y
  } = req.query;

  x = parseInt(x, 10);
  y = parseInt(y, 10);

  Image.findById(id).exec((err, image) => {
    if (err) throw err;

    const imageFile = path.join(
      __dirname, '/img/', image.fileName
    );

    fs.readFile(imageFile, (err, buf) => {
      if (err) throw err;

      crop({
        buf,
        x: x * image.width / image.columns,
        y: y * image.height / image.rows,
        size: image.width / image.columns
      }, (err, newBuf) => {
        if (err) throw err;

        res.setHeader('Content-Type', 'image/jpg')
        res.send(newBuf)
      })
    })
  })
})

export default app
