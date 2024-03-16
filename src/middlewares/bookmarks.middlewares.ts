import {Request} from 'express'
import {checkSchema} from 'express-validator'
import {ObjectId} from 'mongodb'
import HTTP_STATUS from '~/constants/httpStatus'
import {TWEETS_MESSAGE} from '~/constants/messages'
import {ErrorWithStatus} from '~/models/Errors'
import Tweet from '~/models/schemas/Tweet.schema'
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
            const [tweet] = await databaseService.tweets
              .aggregate<Tweet>([
                {
                  $match: {
                    _id: new ObjectId(value)
                  }
                },
                {
                  $lookup: {
                    from: 'hashtags',
                    localField: 'hashtags',
                    foreignField: '_id',
                    as: 'hashtags'
                  }
                },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'mentions',
                    foreignField: '_id',
                    as: 'mentions'
                  }
                },
                {
                  $addFields: {
                    mentions: {
                      $map: {
                        input: '$mentions',
                        as: 'mention',
                        in: {
                          _id: '$$mention._id',
                          name: '$$mention.name',
                          username: '$$mention.username',
                          email: '$$mention.email'
                        }
                      }
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'tweets',
                    localField: '_id',
                    foreignField: 'parent_id',
                    as: 'tweet_children'
                  }
                },
                {
                  $addFields: {
                    retweet_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', 1]
                          }
                        }
                      }
                    },
                    comment_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', 2]
                          }
                        }
                      }
                    },
                    quote_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', 3]
                          }
                        }
                      }
                    }
                  }
                },
                {$project: {tweet_children: 0}}
              ])
              .toArray()

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
