import {Router} from 'express'
import {bookmarkTweetController, unbookmarkTweetController} from '~/controllers/bookmarks.controllers'
import {tweetIdValidator} from '~/middlewares/bookmarks.middlewares'
import {accessTokenValidator, verifiedUserValidator} from '~/middlewares/users.middlewares'
import {wrapRequestHandler} from '~/utils/handlers'

const bookmarksRouter = Router()

/**
 * Desscription: Create bookmark
 * Path: /bookmarks
 * Method: POST
 * Headers: { Authorization: Bearer <access_token> }
 * Body: { tweet_id: string }
 */
bookmarksRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(bookmarkTweetController)
)

/**
 * Desscription: Unbookmark
 * Path: /bookmarks/:tweet_id
 * Method: DELETE
 * Headers: { Authorization: Bearer <access_token> }
 */
bookmarksRouter.delete(
  '/tweets/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(unbookmarkTweetController)
)
export default bookmarksRouter
