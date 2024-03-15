import {Router} from 'express'
import {bookmarkTweetController} from '~/controllers/bookmarks.controllers'
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
bookmarksRouter.post('/', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(bookmarkTweetController))

export default bookmarksRouter
