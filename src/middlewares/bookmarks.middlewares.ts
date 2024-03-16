import {Request} from 'express'
import {checkSchema} from 'express-validator'
import {ObjectId} from 'mongodb'
import HTTP_STATUS from '~/constants/httpStatus'
import {TWEETS_MESSAGE} from '~/constants/messages'
import {ErrorWithStatus} from '~/models/Errors'
import databaseService from '~/services/database.services'
import {validate} from '~/utils/validation'

export const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        custom: {
          options: async (value: string, {req}) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: TWEETS_MESSAGE.INVALID_TWEET_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const tweet = await databaseService.tweets.findOne({_id: new ObjectId(value)})
            if (!tweet) {
              throw new ErrorWithStatus({
                message: TWEETS_MESSAGE.TWEET_NOT_FOUND,
                status: HTTP_STATUS.UNPROCESSABLE_ENTITY
              })
            }
            ;(req as Request).tweet = tweet
            return true
          }
        }
      }
    },
    ['params', 'body']
  )
)
