import { Router } from 'express'
import { createTweetController } from '~/controllers/tweets.controllers'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const tweetsRouter = Router()

/**
 * Desscription: Create tweet
 * Path: /
 * Method: POST
 * Body: TweetRequestBody
 */
tweetsRouter.post('/', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(createTweetController))

export default tweetsRouter
