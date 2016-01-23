import { Server } from 'http'
import express from 'express'
import fs from 'fs'
import path from 'path'
import crop from './crop'

import Image from './models/Image'
import Picture from './models/Picture'
import { createNewPicture, savePicture } from './picture'

import start from './io'

const app = express()

app.use(express.static(path.join(__dirname, '../client')))
app.use(express.static(path.join(__dirname, '/public')))

app.get('/images', (req, res) => {
  Image.find()
    .exec((err, data) => res.json(data))
})

app.get('/image/:id/:x/:y', (req, res) => {
  let {
    id,
    x,
    y
  } = req.params

  x = parseInt(x, 10)
  y = parseInt(y, 10)

  Image.findById(id).exec((err, image) => {
    if (err) throw err

    const imageFile = path.join(
      __dirname, '/img/', image.fileName
    )

    fs.readFile(imageFile, (err, buf) => {
      if (err) {
        throw err
      }

      crop({
        buf,
        x: x * image.width / image.columns,
        y: y * image.height / image.rows,
        size: image.width / image.columns
      }, (err, newBuf) => {
        if (err) throw err

        res.setHeader('Content-Type', 'image/jpg')
        res.send(newBuf)
      })
    })
  })
})

app.get('/image/:id/newPicture', (req, res) => {
  const { id } = req.params

  createNewPicture(id)
    .then(picture => res.json(picture))
})

app.get('/savePicture/:id', (req, res) => {
  savePicture(req.params.id, [])
    .then(x => res.json(x),
      err => res.json(err.message))
})

app.get('/image/:id/pictures', (req, res) => {
  const { id } = req.params

  Promise.all([
    Image.findById(id).exec(),
    Picture.find({
      image: id,
      overwritten: false
    })
      .sort('x y')
      .select('pixels x y _id done')
      .exec()
  ])
    .then(([image, pictures]) => {
      res.json({
        image,
        pictures
      })
    })
})

const server = Server(app)

start(server)

export default server
