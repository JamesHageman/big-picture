import mongoose from 'mongoose'

export const url = process.env.NODE_ENV === 'production' ?
  'mongodb://james:master@ds063899.mongolab.com:63899/big-picture' :
  'mongodb://localhost/big-picture'

mongoose.connect(url)

const db = mongoose.connection

export default db
