import {Request, Response} from 'express'
import {ParamsDictionary} from 'express-serve-static-core'
import {LIKE_MESSAGES} from '~/constants/messages'
import {LikeTweetReqBody} from '~/models/request/Like.request'
import {TokenPayload} from '~/models/request/User.requests'
import likeService from '~/services/likes.services'

export const likeTweetController = async (req: Request<ParamsDictionary, any, LikeTweetReqBody>, res: Response) => {
  const {user_id} = req.decoded_authorization as TokenPayload
  const result = await likeService.likeTweet(user_id, req.body.tweet_id)
  return res.json({
    message: LIKE_MESSAGES.LIKE_SUCCESSFULLY,
    result
  })
}

export const unlikeTweetController = async (req: Request, res: Response) => {
  const {user_id} = req.decoded_authorization as TokenPayload
  await likeService.unlikeTweet(user_id, req.params.tweet_id)
  return res.json({
    message: LIKE_MESSAGES.UNLIKE_SUCCESSFULLY
  })
}
