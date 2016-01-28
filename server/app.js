import { Server } from 'http'
import express from 'express'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import multipart from 'connect-multiparty'
import fs from 'fs'
import path from 'path'
import crop from './crop'
import { url as dbUrl } from './db'
import aws from 'aws-sdk'

import Image from './models/Image'
import Picture from './models/Picture'
import { createNewPicture, savePicture } from './picture'

import start from './io'

const BUCKET = process.env.S3_BUCKET || 'jhageman-big-picture-test'

const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY

if (AWS_ACCESS_KEY && AWS_SECRET_KEY) {
  aws.config.update({
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY
  })
} else {
  aws.config.loadFromPath(path.join(__dirname, '/aws.json'))
}

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
// app.use(express.static(path.join(__dirname, '/img')))

app.get('/images', (req, res) => {
  Image.find()
    .exec((err, data) => res.json(data))
})

app.get('/image/:id/:x/:y', (req, res, next) => {
  let {
    id,
    x,
    y
  } = req.params

  x = parseInt(x, 10)
  y = parseInt(y, 10)

  Image.findById(id).exec((err, image) => {
    if (err) return next(err)

    // const imageFile = path.join(
    //   __dirname, '/img/', image.fileName
    // )

    const s3obj = new aws.S3()

    s3obj.getObject({
      Bucket: BUCKET,
      Key: `images/${image.fileName}`
    }, (err, data) => {
      if (err) return next(err)

      crop({
        buf: data.Body,
        x: x * image.width / image.columns,
        y: y * image.height / image.rows,
        size: image.width / image.columns
      }, (err, newBuf) => {
        if (err) return next(err)

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
  height,
  colors
}) {
  const size = Math.floor(width / columns)

  const i = new Image({
    friendlyName: name,
    fileName: fileName,
    width: width,
    height: height,
    columns: columns,
    colors: colors,
    rows: Math.floor(height / size)
  })

  return i.save()
}

app.post('/uploadImage', multipart(), (req, res, next) => {
  const image = req.files.image
  const {
    name,
    columns,
    width,
    height,
    colors
  } = req.body

  console.log(req.body)

  const fileName = `${Date.now()}___${image.originalFilename}`

  const body = fs.createReadStream(image.path)
  const s3obj = new aws.S3({
    params: {
      Bucket: BUCKET,
      Key: `images/${fileName}`
    }
  })

  s3obj.upload({
    Body: body
  }).send((err) => {
    if (err) return next(err)

    addImage({
      name,
      columns,
      width,
      height,
      fileName,
      colors
    }).then(image => {
      res.json(image)
    }, err => {
      next(err)
    })
  })
})

const server = Server(app)

app.get('*.jpg', (req, res) => {
  // console.log(req.path)
  // res.send('foo')
  res.redirect(`https://${BUCKET}.s3.amazonaws.com/images${req.path}`)
})

app.use((err, req, res, next) => {
  console.error(err.message, err.stack)
  res.status(500).send(err.message)
})

start(server, sessionMiddleware, cookieMiddleware)

export default server
