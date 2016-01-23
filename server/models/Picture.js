import { Schema } from 'mongoose'
import db from '../db'

const pictureSchema = new Schema({
  pixels: [
    [Number]
  ],
  x: Number,
  y: Number,
  done: Boolean,
  image: { type: Schema.Types.ObjectId, ref: 'Image' }
})

const Picture = db.model('Picture', pictureSchema, 'Picture')

export default Picture
