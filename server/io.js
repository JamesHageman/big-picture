import createIO from 'socket.io'
// import Image from './models/Image'
// import Picture from './models/Picture'

import { createNewPicture, savePicture } from './picture'

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

export default function start(server) {
  const io = createIO(server)

  console.log('Socket.io started')

  io.on('connection', (socket) => {
    socket.on('requestPicture', () => {
      sendNewPicture(socket)
    })

    socket.on('updatePicture', ({ _id, pixels }) => {
      socketUpdatePicture(socket, _id, pixels)
    })

    socket.on('savePicture', ({ _id, pixels }) => {
      socketSavePicture(socket, _id, pixels)
    })
  })
}
