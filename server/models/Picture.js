import { Schema } from 'mongoose'
import db from '../db'

const pictureSchema = new Schema({
  pixels: [
    [ Number ]
  ],
  x: Number,
  y: Number,
  imageId: Schema.Types.ObjectId
})

const Picture = db.model('Picture', pictureSchema, 'Picture');

export default Picture
