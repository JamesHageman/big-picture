import mongoose from 'mongoose'

mongoose.connect('mongodb://localhost/big-picture')

const db = mongoose.connection

export default db
