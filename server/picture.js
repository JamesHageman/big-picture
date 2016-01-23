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
  return Image.findOne()
    .exec()
}

export function createNewPicture() {
  return getRandomImage().then(image => {
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

      console.log('saving picutre', _id, pixels.length)
      return picture.save()
    })
}

export function getFullImage(imageId) {
  return Promise.all([
    Image.findById(imageId).exec(),
    Picture.find({
      image: imageId,
      overwritten: false
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
