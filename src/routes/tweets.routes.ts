import {Router} from 'express'
import {createTweetController, getTweetChildrenController, getTweetController} from '~/controllers/tweets.controllers'
import {tweetIdValidator} from '~/middlewares/bookmarks.middlewares'
import {isUserLoggedInValidator} from '~/middlewares/common.middlewares'
import {audienceValidator, createTweetValidator} from '~/middlewares/tweets.middlewares'
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
 * Header: { Authorization?: Bearer <access_token> }
 */
tweetsRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetController)
)

/**
 * Description: Get Tweet Children
 * Path: /:tweet_id/children
 * Method: GET
 * Header: { Authorization?: Bearer <access_token> }
 * Query: { limit: number, page: number, tweet_type: TweetType }
 */
tweetsRouter.get(
  '/:tweet_id/children',
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController)
)
export default tweetsRouter
