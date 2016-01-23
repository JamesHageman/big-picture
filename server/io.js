import createIO from 'socket.io'
// import Image from './models/Image'
// import Picture from './models/Picture'

import { createNewPicture } from './picture'

export default function start(server) {
  const io = createIO(server)

  console.log('Socket.io started')

  io.on('connection', (socket) => {
    socket.on('requestPicture', (imageId) => {
      createNewPicture(imageId).then(picture => {
        socket.emit('newPicture', picture)
      })
    })
  })
}
