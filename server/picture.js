import Picture from './models/Picture'
import Image from './models/Image'

const ptStr = (x, y) => x + ',' + y

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

const addImageData = (picture, imageObj) => {
  const {
    x,
    y,
    image
  } = picture

  let p = picture.toJSON()
  p.imageURL = `/image/${image}/${x}/${y}`
  p.colors = imageObj.colors
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

export function createNewPicture(imageId) {
  return Promise.all([
    Picture.find({
      image: imageId,
      overwritten: false
    }).exec(),
    Image.findById(imageId).exec()
  ])
    .then(([currentPictures, image]) => {
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

      for (let y = 0; y < image.rows; y++) {
        for (let x = 0; x < image.columns; x++) {
          const picture = takenMap[ptStr(x, y)]
          // TODO check 10 minute thingie

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
      }

      return Promise.all([null, image])
    }, err => {
      throw err
    }).then(([picture, image]) => {
      if (picture) {
        return addImageData(picture, image)
      }

      return picture
    }, err => {
      throw err
    })
}
