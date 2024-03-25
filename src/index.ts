import express from 'express'
import cors from 'cors'
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
import YAML from 'yaml'
import fs from 'fs'
import path from 'path'
import swaggerUI from 'swagger-ui-express'
// Nếu dùng swagger-jsdoc thì không dùng file yaml nữa
import swaggerJSDoc from 'swagger-jsdoc'
import {envConfig, isProduction} from './constants/config'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

const app = express()
const httpServer = createServer(app)

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
})

app.use(limiter)
app.use(helmet())
const corsOptions: cors.CorsOptions = {
  origin: isProduction ? envConfig.clientUrl : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsOptions))

const port = envConfig.port

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Twitter API',
      version: '1.0.0',
      description: 'Twitter API'
    }
    // Sử dụng với cú pháp comment
    // components: {
    //   securitySchemes: {
    //     BearerAuth: {
    //       type: 'http',
    //       scheme: 'bearer',
    //       bearerFormat: 'JWT'
    //     }
    //   }
    // }
  },
  // Sử dụng với cú pháp comment
  // apis: ['./src/routes/*.routes.ts', './src/models/schemas/*.schema.ts']
  // Sử dụng với file yaml
  apis: ['./src/openapi/*.yaml']
}
// const file = fs.readFileSync(path.resolve('swagger-twitter.yaml'), 'utf8')
// const swaggerDocument = YAML.parse(file)
const openapiSpecification = swaggerJSDoc(options)

databaseService.connect().then(() => {
  databaseService.indexUsers()
  databaseService.indexRefreshToken()
  databaseService.indexVideoStatus()
  databaseService.indexFollowers()
  databaseService.indexTweets()
})

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

// Swagger UI
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(openapiSpecification))

httpServer.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
