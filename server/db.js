import mongoose from 'mongoose'

export const url = 'mongodb://localhost/big-picture'

mongoose.connect(url)

const db = mongoose.connection

export default db
