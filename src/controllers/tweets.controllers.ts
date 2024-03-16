import {config} from 'dotenv'
import {Request, Response} from 'express'
import {ParamsDictionary} from 'express-serve-static-core'
import {TWEETS_MESSAGE} from '~/constants/messages'
import {TweetRequestBody} from '~/models/request/Tweet.requests'
import {TokenPayload} from '~/models/request/User.requests'
import tweetsService from '~/services/tweets.services'
config()

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response) => {
  const {user_id} = req.decoded_authorization as TokenPayload
  const result = await tweetsService.createTweet(user_id, req.body)
  return res.json({
    message: TWEETS_MESSAGE.CREATE_TWEET_SUCCESS,
    result
  })
}

export const getTweetController = async (req: Request, res: Response) => {
  const result = await tweetsService.increaseView(req.params.tweet_id, req.decoded_authorization?.user_id)
  const tweet = {
    ...req.tweet,
    guest_views: result.guest_views,
    user_views: result.user_views,
    updated_at: result.updated_at
  }
  return res.json({
    message: TWEETS_MESSAGE.GET_TWEET_SUCCESS,
    result: tweet
  })
}
