# Server

## Socket.io

Here are the events you can listen for / emit from the client

### Read
- newPicture: { imageURL, colors[], size, _id }
- error: message

### Write
- requestPicture (no args)
- updatePicture: { _id, pixels[size][size] }
- savePicture: { _id, pixels[size][size] }
