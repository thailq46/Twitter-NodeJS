import {config} from 'dotenv'
import {Request, Response, NextFunction} from 'express'
import {ParamsDictionary} from 'express-serve-static-core'
import {TWEETS_MESSAGE} from '~/constants/messages'
import {TweetRequestBody} from '~/models/request/Tweet.requests'
import {TokenPayload} from '~/models/request/User.requests'
import tweetsService from '~/services/tweets.services'
config()

export const createTweetController = async (
  req: Request<ParamsDictionary, any, TweetRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const {user_id} = req.decoded_authorization as TokenPayload
  const result = await tweetsService.createTweet(user_id, req.body)
  return res.json({
    message: TWEETS_MESSAGE.CREATE_TWEET_SUCCESS,
    result
  })
}
