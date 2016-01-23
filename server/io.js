import createIO from 'socket.io'
// import Image from './models/Image'
// import Picture from './models/Picture'
import sharedSession from 'express-socket.io-session'

import {
  createNewPicture,
  savePicture,
  getPicture,
  getFullImage
} from './picture'

let io

const imageRoom = id => `/image/${id}`

function sendPictureUpdate(picture) {
  const room = imageRoom(picture.image)
  console.log('Send update to room ', picture)
  io.of(room).emit('updatePicture', picture)
}

function sendError(socket, err) {
  console.log('Socket error', err.message, err.stack)
  socket.emit('serverError', err.message)
}

function errorHandler(socket) {
  return function(err) {
    sendError(socket, err)
  }
}

function sendNewPicture(socket) {
  createNewPicture().then(picture => {
    socket.emit('newPicture', picture)
    // console.log('saving ', picture._id, socket.handshake.session)
    socket.handshake.session.currentPicture = picture._id
    socket.handshake.session.save()
  }, errorHandler(socket))
}

function socketSavePicture(socket, _id, pixels) {
  savePicture({ _id, pixels, done: true }).then((picture) => {
    sendNewPicture(socket)
    sendPictureUpdate(picture)
  }, errorHandler(socket))
}

function socketUpdatePicture(socket, _id, pixels) {
  savePicture({ _id, pixels, done: false }).then(picture => {
    sendPictureUpdate(picture)
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

    socket.on('requestPicture', () => {
      sendNewPicture(socket)
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
  })

  io.of('/image').on('connection', (socket) => {
    socket.on('setImage', imageId => {
      socket.imageId = imageId
      socket.join(imageRoom(imageId))

      sendImage(socket)
    })
  })
}
