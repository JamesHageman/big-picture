import mongoose from 'mongoose'

export const url = process.env.NODE_ENV === 'production' ?
  'mongodb://james:master@dbh15.mongolab.com:27157/big-picture' :
  'mongodb://localhost/big-picture'

mongoose.connect(url)

const db = mongoose.connection

export default db
