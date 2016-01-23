import createIO from 'socket.io'
// import Image from './models/Image'
// import Picture from './models/Picture'

import { createNewPicture, savePicture } from './picture'

function sendError(socket, err) {
  socket.emit('error', err.message)
}

function sendNewPicture(socket) {
  createNewPicture().then(picture => {
    socket.emit('newPicture', picture)
  }, (err) => sendError(socket, err))
}

function socketSavePicture(socket, _id, pixels) {
  savePicture(_id, pixels).then(() => {
    sendNewPicture(socket)
  }, (err) => sendError(socket, err))
}

export default function start(server) {
  const io = createIO(server)

  console.log('Socket.io started')

  io.on('connection', (socket) => {
    socket.on('requestPicture', () => {
      sendNewPicture(socket)
    })

    socket.on('savePicture', ({ _id, pixels }) => {
      socketSavePicture(socket, _id, pixels)
    })
  })
}
