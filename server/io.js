import createIO from 'socket.io'
// import Image from './models/Image'
// import Picture from './models/Picture'
import sharedSession from 'express-socket.io-session'

import { createNewPicture, savePicture, getPicture } from './picture'

function sendError(socket, err) {
  socket.emit('error', err.message)
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
  savePicture({ _id, pixels, done: true }).then(() => {
    sendNewPicture(socket)
  }, errorHandler(socket))
}

function socketUpdatePicture(socket, _id, pixels) {
  savePicture({ _id, pixels, done: false }).then(picture => {
    console.log('updated picture ', picture._id)
  }, errorHandler(socket))
}

function sendCurrentPicture(socket) {
  const pictureId = socket.handshake.session.currentPicture
  getPicture(pictureId).then(picture => {
    socket.emit('newPicture', picture)
  }, errorHandler(socket))
}

export default function start(server, sessionMiddleware, cookieMiddleware) {
  const io = createIO(server)

  io.use(sharedSession(sessionMiddleware, cookieMiddleware, {
    autoSave: true
  }))

  console.log('Socket.io started')

  io.on('connection', (socket) => {
    console.log(socket.handshake.session)

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
  })
}
