import createIO from 'socket.io'
// import Image from './models/Image'
// import Picture from './models/Picture'
import sharedSession from 'express-socket.io-session'

import {
  createNewPicture,
  savePicture,
  getPicture,
  getFullImage,
  getImages,
  cancelPicture,
  flagPicture
} from './picture'

let io

const imageRoom = id => `/image/${id}`

function sendError(socket, err) {
  console.log('Socket error', err.message, err.stack)
  socket.emit('serverError', err.message)
}

function errorHandler(socket) {
  return function(err) {
    sendError(socket, err)
  }
}

function sendPictureUpdate(socket, picture) {
  const room = imageRoom(picture.image)
  getPicture(picture._id)
    .then(picture => {
      io.sockets.in(room).emit('updatePicture', picture)
    }, errorHandler(socket))
}

function sendNewPicture(socket, imageId) {
  createNewPicture(imageId).then(picture => {
    socket.emit('newPicture', picture)
    // console.log('saving ', picture._id, socket.handshake.session)
    socket.handshake.session.currentPicture = picture._id
    socket.handshake.session.save()
  }, errorHandler(socket))
}

function socketSavePicture(socket, _id, pixels) {
  savePicture({ _id, pixels, done: true }).then((picture) => {
    sendPictureUpdate(socket, picture)
    socket.handshake.session.currentPicture = null
    socket.handshake.session.save()
  }, errorHandler(socket))
}

function socketUpdatePicture(socket, _id, pixels) {
  savePicture({ _id, pixels, done: false }).then(picture => {
    sendPictureUpdate(socket, picture)
  }, errorHandler(socket))
}

function sendCurrentPicture(socket) {
  const pictureId = socket.handshake.session.currentPicture
  getPicture(pictureId).then(picture => {
    if (!picture) {
      sendNewPicture(socket)
    } else {
      socket.emit('newPicture', picture)
    }
  }, errorHandler(socket))
}

function sendImage(socket) {
  const id = socket.imageId
  getFullImage(id)
    .then(({ image, pictures, size }) => {
      socket.emit('getImage', {
        image,
        pictures,
        size
      })
    })
}

export default function start(server, sessionMiddleware, cookieMiddleware) {
  io = createIO(server)

  const ioSesson = sharedSession(sessionMiddleware, cookieMiddleware, {
    autoSave: true
  })

  io.use(ioSesson)

  console.log('Socket.io started')

  io.on('connection', (socket) => {
    if (socket.handshake.session.currentPicture) {
      sendCurrentPicture(socket)
    }

    socket.on('requestPicture', (imageId) => {
      sendNewPicture(socket, imageId)
    })

    socket.on('updatePicture', ({ _id, pixels }) => {
      console.log('update', _id, pixels.length)
      socketUpdatePicture(socket, _id, pixels)
    })

    socket.on('savePicture', ({ _id, pixels }) => {
      socketSavePicture(socket, _id, pixels)
    })

    socket.on('testError', () => {
      sendError(socket, new Error('This is a test error'))
    })

    socket.on('setImage', imageId => {
      socket.imageId = imageId
      socket.join(imageRoom(imageId))

      sendImage(socket)
    })

    socket.on('requestImages', () => {
      getImages().then(({
        complete, inProgress
      }) => {
        socket.emit('getImages', {
          complete, inProgress
        })
      })
    })

    socket.on('cancelPicture', () => {
      const { currentPicture } = socket.handshake.session

      if (currentPicture) {
        cancelPicture(currentPicture)
          .then(() => {
            socket.handshake.session.currentPicture = null
            socket.handshake.session.save()
            socket.emit('pictureCancelled')
          },
            errorHandler(socket))
      }
    })

    socket.on('flagPicture', (pictureId) => {
      flagPicture(pictureId)
        .then(() => {}, errorHandler(socket))
    })
  })
}
