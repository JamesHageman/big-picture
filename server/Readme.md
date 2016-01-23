# Server

## Socket.io

Here are the events you can listen for / emit from the client

### Read
- newPicture: { imageURL, colors[], size, _id }
- error: message

### Write
- requestPicture (no args)
- savePicture: { _id, pixels[32][32] }
