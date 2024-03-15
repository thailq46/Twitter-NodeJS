import {Request, Response} from 'express'
import {ParamsDictionary} from 'express-serve-static-core'
import {BOOKMARKS_MESSAGE} from '~/constants/messages'
import {BookmarkTweetReqBody} from '~/models/request/Bookmark.request'
import {TokenPayload} from '~/models/request/User.requests'
import bookmarksService from '~/services/bookmarks.services'

export const bookmarkTweetController = async (
  req: Request<ParamsDictionary, any, BookmarkTweetReqBody>,
  res: Response
) => {
  const {user_id} = req.decoded_authorization as TokenPayload
  const result = await bookmarksService.bookmarkTweet(req.body.tweet_id, user_id)
  return res.json({
    message: BOOKMARKS_MESSAGE.BOOKMARK_TWEET_SUCCESS,
    result
  })
}
