import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
const serverless = require("serverless-http")
import authRoutes from '../routes/auth.js'
import articleRoutes from '../routes/articles.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

mongoose
  .connect(process.env.MONGODB_URI || '')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err))

app.get('/', (req, res) => {
  res.send(
    '✒️ "Welcome to the Penwise API - where words shape reality and stories find their voice."'
  )
})
  

app.use('/api/auth', authRoutes)
app.use('/api/articles', articleRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

app.use("/.netlify/functions/app", router)
module.exports.handler = serverless(app)