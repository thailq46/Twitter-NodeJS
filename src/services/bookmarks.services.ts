import Bookmark from '~/models/schemas/Bookmark.schema'
import databaseService from './database.services'
import {ObjectId, WithId} from 'mongodb'

class BookmarkService {
  async bookmarkTweet(tweet_id: string, user_id: string) {
    const result = await databaseService.bookmarks.findOneAndUpdate(
      {
        tweet_id: new ObjectId(tweet_id),
        user_id: new ObjectId(user_id)
      },
      {
        $setOnInsert: {
          tweet_id: new ObjectId(tweet_id),
          user_id: new ObjectId(user_id),
          created_at: new Date()
        }
      },
      {upsert: true, returnDocument: 'after'}
    )
    return result as WithId<Bookmark>
  }
}

const bookmarksService = new BookmarkService()
export default bookmarksService
