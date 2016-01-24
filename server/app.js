import { Server } from 'http'
import express from 'express'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import multipart from 'connect-multiparty'
import fs from 'fs'
import path from 'path'
import crop from './crop'
import { url as dbUrl } from './db'

import Image from './models/Image'
import Picture from './models/Picture'
import { createNewPicture, savePicture } from './picture'

import start from './io'

const MongoDBStore = require('connect-mongodb-session')(session)

const app = express()

const secret = 'lol secuity'
const maxAge = 1000 * 60 * 60 * 24 * 7 // 1 week

const cookieMiddleware = cookieParser(secret, {
  maxAge: maxAge
})

const sessionMiddleware = session({
  secret: secret,
  cookie: {
    maxAge: maxAge
  },
  resave: true,
  saveUninitialized: true,
  store: new MongoDBStore({
    uri: dbUrl,
    collection: 'sessions'
  })
})

app.use(cookieMiddleware)
app.use(sessionMiddleware)

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

function addImage({
  name,
  columns,
  fileName,
  width,
  height
}) {
  const size = Math.floor(width / columns)

  const i = new Image({
    friendlyName: name,
    fileName: fileName,
    width: width,
    height: height,
    columns: columns,
    rows: Math.floor(height / size)
  })

  return i.save()
}

app.post('/uploadImage', multipart(), (req, res) => {
  const image = req.files.image
  const {
    name,
    columns,
    width,
    height
  } = req.body

  console.log(req.body)

  fs.readFile(image.path, (err, data) => {
    if (err) throw err

    const fileName = `${Date.now()}___${image.originalFilename}`
    const newPath = path.join(__dirname, '/img/', fileName)

    fs.writeFile(newPath, data, err => {
      if (err) throw err

      addImage({
        name,
        columns,
        width,
        height,
        fileName
      }).then(image => res.json(image), err => {
        throw err
      })
    })
  })
})

const server = Server(app)

start(server, sessionMiddleware, cookieMiddleware)

export default server
