import Picture from './models/Picture'
import Image from './models/Image'

const ptStr = (x, y) => x + ',' + y

const PICTURE_SIZE = 32

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
    pixels: null
  })

  return p.save()
}

const addImageData = (picture, imageObj) => {
  const {
    x,
    y,
    _id,
    pixels
  } = picture

  let p = {}
  p.imageURL = `/image/${imageObj._id}/${x}/${y}`
  p.colors = imageObj.colors
  p.size = PICTURE_SIZE
  p._id = _id
  p.pixels = JSON.parse(pixels)
  p.x = x
  p.y = y
  p.friendlyName = imageObj.friendlyName
  return p
}

const canOverwritePicture = picture => {
  const now = Date.now()
  const time = 10 * 60 * 1000

  return !picture.done && now - picture.createdAt > time
}

const overwrite = (picture, replacement) => {
  picture.overwritten = true
  return picture.save()
    .then(() => replacement)
}

function getRandomImage() {
  return Image.findOne({
    complete: { $ne: true }
  })
    .sort('-createdAt')
    .exec().then(image => {
      if (!image) throw new Error('Can`t find image')

      return image
    })
}

function checkImageComplete(imageId) {
  Promise.all([
    Image.findById(imageId).exec(),
    Picture.find({
      image: imageId,
      overwritten: false,
      done: true
    }).select('x y').exec()
  ]).then(([image, pictures]) => {
    const uniquePictureCount = image.columns * image.rows
    let map = {}

    pictures.forEach(picture => {
      map[ptStr(picture.x, picture.y)] = true
    })

    if (Object.keys(map).length === uniquePictureCount) {
      image.complete = true
    } else {
      image.complete = false
    }

    return image.save()
  })
}

export function createNewPicture(imageId) {
  let imagePromise = null

  if (imageId) {
    imagePromise = Image.findById(imageId).exec().then(img => {
      if (!img) throw new Error(`Image ${imageId} not found`)

      return img
    })
  } else {
    imagePromise = getRandomImage()
  }

  return imagePromise.then(image => {
    return Promise.all([
      Picture.find({
        image: image._id,
        overwritten: false
      })
      .sort({
        createdAt: 'asc'
      }).exec(),
      image
    ])
  }).then(([currentPictures, image]) => {
    const takenMap = {}

    currentPictures.forEach(picture => {
      takenMap[ptStr(picture.x, picture.y)] = picture
    })

    // look for untaken pictures
    for (let y = 0; y < image.rows; y++) {
      for (let x = 0; x < image.columns; x++) {
        if (!takenMap[ptStr(x, y)]) {
          return Promise.all([
            createPicture({
              x,
              y,
              image
            }),
            image
          ])
        }
      }
    }

    // look for pictures that are not 'done' and were started
    // >10 mins ago

    for (let i = 0; i < currentPictures.length; i++) {
      const picture = currentPictures[i]

      if (canOverwritePicture(picture)) {
        return Promise.all([
          createPicture({
            x: picture.x,
            y: picture.y,
            image: image
          }).then(replacement => {
            return overwrite(picture, replacement)
          }),

          image
        ])
      }
    }

    return Promise.all([null, image])
  }).then(([picture, image]) => {
    if (picture) {
      return addImageData(picture, image)
    } else {
      checkImageComplete(image._id)
    }

    return picture
  }, err => {
    throw err
  })
}

export function getPicture(id) {
  return Picture.findById(id)
    .populate('image')
    .exec()
    .then(picture => {
      if (!picture) return null
      return addImageData(picture, picture.image)
    })
}

export function savePicture({ _id, pixels, done = false }) {
  return Picture.findById(_id).exec()
    .then(picture => {
      if (pixels.length !== PICTURE_SIZE) {
        throw new Error(
          `expected ${PICTURE_SIZE} rows, got ${pixels.length}`
        )
      }

      pixels.forEach((row, i) => {
        if (row.length !== PICTURE_SIZE) {
          throw new Error(
            `expected row ${i} to have ${PICTURE_SIZE} elements,
            got ${row.length}`
          )
        }
      })

      picture.pixels = JSON.stringify(pixels)
      picture.done = done
      // picture.markModified('pixels')

      console.log('saving picture', _id, pixels.length)
      return picture.save().then(pic => {
        if (done) {
          checkImageComplete(pic.image)
        }
        return pic
      })
    })
}

export function getFullImage(imageId) {
  return Promise.all([
    Image.findById(imageId).exec(),
    Picture.find({
      image: imageId,
      overwritten: false,
      pixels: { $ne: null }
    })
      .sort('x y')
      .select('pixels x y _id done')
      .exec()
  ]).then(([image, pictures]) => {
    return {
      image,
      pictures: pictures.map(picture => addImageData(picture, image)),
      size: PICTURE_SIZE
    }
  })
}

export function getImages() {
  return Promise.all([
    Image.find({ complete: true }).sort('-createdAt').exec(),
    Image.find({ complete: { $ne: true } }).exec().then(images => {
      return Promise.all(images.map(i => {
        return i.calculatePercentComplete().then((percent) => {
          i = i.toJSON()
          i.percent = percent
          return i
        })
      }))
    })
  ]).then(([complete, inProgress]) => {
    return {
      complete,
      inProgress
    }
  })
}

export function cancelPicture(id) {
  console.log('Cancel picture ', id)
  return Picture.remove({ _id: id }).exec()
}

export function flagPicture(id) {
  return Picture.findById(id)
    .then(picture => {
      if (!picture) throw new Error(`Picture ${id} not found`)

      if (!picture.flag) {
        picture.flag = 0
      }

      picture.flag++
      if (picture.flag >= 5) {
        picture.overwritten = true
      }

      return picture.save()
    })
}
