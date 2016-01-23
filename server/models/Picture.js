import { Schema } from 'mongoose'
import db from '../db'
import timestamps from 'mongoose-timestamp'

const pictureSchema = new Schema({
  pixels: String, // JSON serialized 2d array
  x: Number,
  y: Number,
  done: {
    type: Boolean,
    default: false
  },
  image: { type: Schema.Types.ObjectId, ref: 'Image' },
  overwritten: {
    type: Boolean,
    default: false
  }
})

pictureSchema.plugin(timestamps)

const Picture = db.model('Picture', pictureSchema, 'Picture')

export default Picture
