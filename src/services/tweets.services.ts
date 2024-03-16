import {TweetRequestBody} from '~/models/request/Tweet.requests'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import {ObjectId, WithId} from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schema'

class TweetsService {
  async checkandCreateHashtags(hashtags: string[]) {
    const hashtagDocuments = await Promise.all(
      hashtags.map((hashtag) => {
        // Tìm hashtag trong db nếu có thì lấy ko thì tạo mới
        return databaseService.hashtags.findOneAndUpdate(
          {name: hashtag},
          {$setOnInsert: new Hashtag({name: hashtag})},
          {upsert: true, returnDocument: 'after'}
        )
      })
    )
    return hashtagDocuments.map((hashtag) => hashtag?._id)
  }
  async createTweet(user_id: string, body: TweetRequestBody) {
    const hashtags = await this.checkandCreateHashtags(body.hashtags)
    const result = await databaseService.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        hashtags: hashtags as ObjectId[],
        mentions: body.mentions,
        medias: body.medias,
        parent_id: body.parent_id,
        type: body.type,
        user_id: new ObjectId(user_id)
      })
    )
    const tweet = await databaseService.tweets.findOne({_id: result.insertedId})
    return tweet
  }
  async increaseView(tweet_id: string, user_id?: string) {
    const inc = user_id ? {user_views: 1} : {guest_views: 1}
    const result = await databaseService.tweets.findOneAndUpdate(
      {_id: new ObjectId(tweet_id)},
      {$inc: inc, $currentDate: {updated_at: true}},
      {
        returnDocument: 'after',
        projection: {
          guest_views: 1,
          user_views: 1,
          updated_at: 1
        }
      }
    )
    return result as WithId<{
      guest_views: number
      user_views: number
      updated_at: Date
    }>
  }
}

const tweetsService = new TweetsService()
export default tweetsService
