import { Schema } from 'mongoose'
import db from '../db'
import timestamps from 'mongoose-timestamp'

const imageSchema = new Schema({
  fileName: String,
  friendlyName: String,
  width: Number,
  height: Number,
  colors: [String],
  rows: Number,
  columns: Number
})

imageSchema.plugin(timestamps)

const Image = db.model('Image', imageSchema, 'Image')

export default Image
