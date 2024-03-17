import {TweetRequestBody} from '~/models/request/Tweet.requests'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import {ObjectId, WithId} from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schema'
import {TweetType} from '~/constants/enums'

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
  async getTweetChildren({
    tweet_id,
    tweet_type,
    limit,
    page,
    user_id
  }: {
    tweet_id: string
    tweet_type: TweetType
    limit: number
    page: number
    user_id?: string
  }) {
    const tweets = await databaseService.tweets
      .aggregate<Tweet>([
        {
          $match: {
            parent_id: new ObjectId(tweet_id),
            type: tweet_type
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
            from: 'bookmarks',
            localField: '_id',
            foreignField: 'tweet_id',
            as: 'bookmarks'
          }
        },
        {
          $lookup: {
            from: 'likes',
            localField: '_id',
            foreignField: 'tweet_id',
            as: 'likes'
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
            bookmarks: {
              $size: '$bookmarks'
            },
            likes: {
              $size: '$likes'
            },
            retweet_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetType.Retweet]
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
                    $eq: ['$$item.type', TweetType.Comment]
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
                    $eq: ['$$item.type', TweetType.QuoteTweet]
                  }
                }
              }
            }
          }
        },
        {$project: {tweet_children: 0}},
        {$skip: limit * (page - 1)}, // Công thức phân trang
        {$limit: limit}
      ])
      .toArray()

    // $currentDate: tính vào cái lúc mongodb nó chạy
    // new Date(): lấy tính thời gian khi chạy code (code server chạy trước rồi mới đến code mongodb chạy sau => $currentDate lúc này cũng chạy xong tý xíu)
    const ids = tweets.map((tweet) => tweet._id as ObjectId)

    const inc = user_id ? {user_views: 1} : {guest_views: 1}
    const date = new Date()
    const [, total] = await Promise.all([
      databaseService.tweets.updateMany(
        // $in: tìm những tweet nào có _id nằm trong ids
        {_id: {$in: ids}},
        {$inc: inc, $set: {updated_at: date}}
      ),
      databaseService.tweets.countDocuments({
        parent_id: new ObjectId(tweet_id),
        type: tweet_type
      })
    ])
    // Do code bên trên không return về dữ liệu nên phải forEach để return lại cho người dùng dữ liệu đã cập nhật rồi
    tweets.forEach((tweet) => {
      tweet.updated_at = date
      if (user_id) {
        tweet.user_views += 1
      } else {
        tweet.guest_views += 1
      }
    })
    return {
      tweets,
      total
    }
  }

  async getNewFeeds({user_id, limit, page}: {user_id: string; limit: number; page: number}) {
    const user_id_obj = new ObjectId(user_id)
    const followed_user_ids = await databaseService.followers
      .find(
        {user_id: user_id_obj},
        {
          projection: {followed_user_id: 1, _id: 0}
        }
      )
      .toArray()
    const ids = followed_user_ids.map((item) => item.followed_user_id)
    // Mong muốn newfeed sẽ lấy luôn cả tweet của mình
    ids.push(user_id_obj)

    // Đầu tiên lấy 1 list danh sách những người mà mình đang theo dõi (mình đc 1 mảng follower_user_id)
    // Sau đó đưa cái mảng follower_user_id vào $in để lấy ra những tweet mà những người mình đang theo dõi đã đăng (mình lọc ra những tweet mà user_id nằm trong mảng follower_user_id)
    // Sử dụng $lookup để join với bảng users để lấy thông tin của người đăng tweet
    // Sử dụng $unwind để đưa mảng user thành từng phần tử (array -> object)
    // Lọc ra những tweet mà mọi ngưởi có thể xem được (audience = 0) hoặc là tweet của những người nằm trong twitter_circle mới xem được (audience = 1)
    // Phân trang
    // Sử dụng $lookup để join với bảng hashtags để lấy thông tin của hashtag
    // Sử dụng $lookup để join với bảng users để lấy thông tin của người được mention
    // Sử dụng $addFields để thêm field mentions vào tweet
    // Sử dụng $lookup để join với bảng bookmarks để lấy thông tin của bookmark
    // Sử dụng $lookup để join với bảng likes để lấy thông tin của like
    // Sử dụng $lookup để join với bảng tweets để lấy thông tin của tweet con
    // Sử dụng $addFields để thêm field bookmarks, likes, retweet_count, comment_count, quote_count vào tweet
    // Sử dụng $project để lọc ra những field mà mình cần

    // Sử dụng $count để đếm tổng số tweet (vì khi sử dụng $count nó chỉ trả về 1 document duy nhất chứa tổng số tweet cho nên mình phải tách riêng thành 2 phần: 1 phần lấy ra thông tin tweet, 1 phần lấy ra tổng số tweet)
    const [tweets, total] = await Promise.all([
      databaseService.tweets
        .aggregate([
          {$match: {user_id: {$in: ids}}},
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {path: '$user'}
          },
          {
            $match: {
              $or: [
                {audience: 0},
                {
                  $and: [
                    {audience: 1},
                    {
                      'user.twitter_circle': {
                        $in: [user_id_obj]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {$skip: limit * (page - 1)}, // Công thức phân trang
          {$limit: limit},
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
              from: 'bookmarks',
              localField: '_id',
              foreignField: 'tweet_id',
              as: 'bookmarks'
            }
          },
          {
            $lookup: {
              from: 'likes',
              localField: '_id',
              foreignField: 'tweet_id',
              as: 'likes'
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
              bookmarks: {
                $size: '$bookmarks'
              },
              likes: {
                $size: '$likes'
              },
              retweet_count: {
                $size: {
                  $filter: {
                    input: '$tweet_children',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetType.Retweet]
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
                      $eq: ['$$item.type', TweetType.Comment]
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
                      $eq: ['$$item.type', TweetType.QuoteTweet]
                    }
                  }
                }
              }
            }
          },
          {
            $project: {
              tweet_children: 0,
              user: {
                password: 0,
                email_verify_token: 0,
                forgot_password_token: 0,
                twitter_circle: 0,
                date_of_birth: 0
              }
            }
          }
        ])
        .toArray(),
      databaseService.tweets
        .aggregate([
          {$match: {user_id: {$in: ids}}},
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {$unwind: {path: '$user'}},
          {
            $match: {
              $or: [
                {audience: 0},
                {
                  $and: [
                    {audience: 1},
                    {
                      'user.twitter_circle': {
                        $in: [user_id_obj]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {$count: 'total'}
        ])
        .toArray()
    ])
    const tweet_ids = tweets.map((tweet) => tweet._id as ObjectId)
    const date = new Date()

    // Duyệt qua từng tweet để tăng view cho từng tweet có _id nằm trong tweet_ids (cập nhật vào database)
    await databaseService.tweets.updateMany(
      {
        _id: {$in: tweet_ids}
      },
      {$inc: {user_views: 1}, $set: {updated_at: date}}
    )

    // Duyệt qua từng tweet để thêm view cho từng tweet (cập nhật cho giá trị trả về)
    tweets.forEach((tweet) => {
      tweet.updated_at = date
      tweet.user_views += 1
    })

    // total: [ { total: 800 } ] => total[0].total
    return {
      tweets,
      total: total[0]?.total || 0
    }
  }
}

const tweetsService = new TweetsService()
export default tweetsService
