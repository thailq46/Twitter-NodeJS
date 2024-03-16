import {Router} from 'express'
import {createTweetController, getTweetController} from '~/controllers/tweets.controllers'
import {tweetIdValidator} from '~/middlewares/bookmarks.middlewares'
import {isUserLoggedInValidator} from '~/middlewares/common.middlewares'
import {createTweetValidator} from '~/middlewares/tweets.middlewares'
import {accessTokenValidator, verifiedUserValidator} from '~/middlewares/users.middlewares'
import {wrapRequestHandler} from '~/utils/handlers'

const tweetsRouter = Router()

/**
 * Desscription: Create tweet
 * Path: /tweets
 * Method: POST
 * Headers: { Authorization: Bearer <access_token> }
 * Body: TweetRequestBody
 */
tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
)

/**
 * Desscription: GET Tweet Detail
 * Path: /:tweet_id
 * Method: GET
 */
tweetsRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  wrapRequestHandler(getTweetController)
)

export default tweetsRouter
