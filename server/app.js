import express from 'express'
import fs from 'fs'
import path from 'path'
import crop from './crop'

import Image from './models/Image'
import Picture from './models/Picture'

const ptStr = (x, y) => x + ',' + y

const app = express()

app.use(express.static('/public'))

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

const createPicture = ({
  image,
  x,
  y
}) => {
  const p = new Picture({
    x: x,
    y: y,
    image: image._id,
    done: false,
    pixels: []
  })

  return p.save()
}

app.get('/image/:id/newPicture', (req, res) => {
  const { id } = req.params

  Promise.all([
    Picture.find({ image: id }).exec(),
    Image.findById(id).exec()
  ])
    .then(([currentPictures, image]) => {
      const takenMap = {}

      currentPictures.forEach(picture => {
        takenMap[ptStr(picture.x, picture.y)] = picture.done ? 2 : 1
      })

      for (let y = 0; y < image.rows; y++) {
        for (let x = 0; x < image.columns; x++) {
          if (!takenMap[ptStr(x, y)]) {
            return createPicture({
              x,
              y,
              image
            })
          }
        }
      }

      return Promise.resolve(null)
    }, err => {
      throw err
    }).then(picture => {
      res.json(picture)
    })
})

export default app
