import mongoose from 'mongoose'

export const url = process.env.DB_URL || 'mongodb://localhost/big-picture'

mongoose.connect(url)

const db = mongoose.connection

export default db
