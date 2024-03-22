import express from 'express'
import cors from 'cors'
import {config} from 'dotenv'
import usersRouter from '~/routes/users.routes'
import tweetsRouter from '~/routes/tweets.routes'
import staticRouter from '~/routes/static.routes'
import searchRouter from '~/routes/search.routes'
import mediasRouter from '~/routes/medias.routes'
import likesRouter from '~/routes/likes.routes'
import initSocket from './utils/socket'
import databaseService from '~/services/database.services'
import conversationsRouter from '~/routes/conversations.routes'
import bookmarksRouter from '~/routes/bookmarks.routes'
import {initFolder} from '~/utils/file'
import {defaultErrorHandler} from '~/middlewares/error.middlewares'
import {createServer} from 'http'
// import '~/utils/fake'

config()

databaseService.connect().then(() => {
  databaseService.indexUsers()
  databaseService.indexRefreshToken()
  databaseService.indexVideoStatus()
  databaseService.indexFollowers()
  databaseService.indexTweets()
})

const app = express()
const httpServer = createServer(app)

app.use(cors())
const port = process.env.PORT || 4000

// Tạo folder uploads
initFolder()

//how to using req.body
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/static', staticRouter)
app.use('/tweets', tweetsRouter)
app.use('/bookmarks', bookmarksRouter)
app.use('/likes', likesRouter)
app.use('/search', searchRouter)
app.use('/conversations', conversationsRouter)

app.use(defaultErrorHandler)

initSocket(httpServer)

httpServer.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
