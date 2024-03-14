import express from 'express'
import usersRouter from '~/routes/users.routes'
import databaseService from '~/services/database.services'
import { defaultErrorHandler } from '~/middlewares/error.middlewares'
import mediasRouter from './routes/medias.routes'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import staticRouter from './routes/static.routes'
import cors from 'cors'

config()
databaseService.connect()

const app = express()
app.use(cors())
const port = process.env.PORT || 4000

// Tạo folder uploads
initFolder()

//how to using req.body
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/static', staticRouter)

app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
