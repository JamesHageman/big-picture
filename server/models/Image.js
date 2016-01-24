import { Schema } from 'mongoose'
import db from '../db'
import timestamps from 'mongoose-timestamp'
import Picture from './Picture'

const imageSchema = new Schema({
  fileName: String,
  friendlyName: String,
  width: Number,
  height: Number,
  colors: [String],
  rows: Number,
  columns: Number,
  complete: {
    type: Boolean,
    default: false
  }
})

imageSchema.methods.calculatePercentComplete = function() {
  return Picture.find({
    image: this._id,
    done: true
  }).select('x y').exec().then(pictures => {
    const total = this.columns * this.rows

    let map = {}

    pictures.forEach(p => {
      map[p.x + ',' + p.y] = true
    })

    const numPictures = Object.keys(map).length

    const percentComplete = numPictures / total * 100

    return percentComplete
  })
}

imageSchema.plugin(timestamps)

const Image = db.model('Image', imageSchema, 'Image')

export default Image
