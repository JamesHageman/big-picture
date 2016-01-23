import { Schema } from 'mongoose'
import db from '../db'

const imageSchema = new Schema({
  fileName: String,
  width: Number,
  height: Number,
  colors: [ String ],
  rows: Number,
  columns: Number
})

const Image = db.model('Image', imageSchema, 'Image');

export default Image
