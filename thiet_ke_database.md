# Setup dự án NodeJS TS

`https://duthanhduoc.com/blog/setup-du-an-nodejs-typescript#cau-hinh-tsconfigjson`

## Connect DB

```js
const connection = `mongodb+srv://thailq:thailq123@twitter.hdyolge.mongodb.net/`
```

### Authentication

[[P1]: Basic Authentication](https://duthanhduoc.com/blog/p1-giai-ngo-authentication-basic-authentication)
[[P2]: Cookie và Session Authentication](https://duthanhduoc.com/blog/p2-giai-ngo-authentication-session)
[[P3]: JWT ](https://duthanhduoc.com/blog/p3-giai-ngo-authentication-jwt)

`Token là một chuỗi ký tự được tạo ra để đại diện cho một đối tượng hoặc một quyền truy cập nào đó`

# Thiết kế Schema Twitter bằng MongoDB

Một số ghi chú nhỏ

- Tên collection nên được đặt theo dạng số nhiều, kiểu snake_case, ví dụ `users`, `refresh_tokens`
- Tên field nên được đặt theo dạng snake_case, ví dụ `email_verify_token`, `forget_password_token`
- `_id` là trường được MongoDB tự động tạo ra, không cần phải thêm trường `_id` vào. Cũng không nên tìm mọi cách để đổi tên `_id` thành `id` hay thay đổi cơ chế của nó. Vì sẽ làm giảm hiệu suất của MongoDB
- Trường `created_at` , `updated_at` nên có kiểu `Date` để dễ dàng sắp xếp, tìm kiếm, lọc theo thời gian
- Trường `created_at` nên luôn luôn được thêm vào khi tạo mới document
- Trường `updated_at` thì optional
- Tất cả trường đại diện id của document thì nên có kiểu `ObjectId`

## Phân tích chức năng

### Users

- Người dùng đăng ký nhập `name`, `email`, `day_of_birth`, `password` là được. Vậy `name`, `email`, `day_of_birth`, `password` là những trường bắt buộc phải có bên cạnh `_id` là trường tự động tạo ra bởi MongoDB

- Sau khi đăng ký xong thì sẽ có email đính kèm `email_verify_token` để xác thực email (`lequangthai.com?verify-email?email_verify_token=123123`). Mỗi user chỉ có 1 `email_verify_token` duy nhất, vì nếu user nhấn re-send email thì sẽ tạo ra `email_verify_token` mới thay thế cái cũ. Vậy nên ta lưu thêm trường `email_verify_token` vào schema `Users`. Trường này có kiểu `string`, nếu user xác thực email thì ta sẽ set `''`

- Tương tự ta có chức năng quên mật khẩu thì sẽ gửi mail về để reset mật khẩu, ta cũng dùng `forgot_password_token` để xác thực (`lequangthai.com?forgot-password?forgot_password_token=123123`). Vậy ta cũng lưu thêm trường `forgot_password_token` vào schema `Users`. Trường này có kiểu `String`, nếu user reset mật khẩu thì ta sẽ set `''`

- Nên có 1 trường là `verify` để biết trạng thái tài khoản của user. Ví dụ chưa xác thực email, đã xác thực email, bị khoá, lên tích xanh ✅. Vậy giá trị của nó nên là enum

- Người dùng có thể update các thông tin sau vào profile: `bio`, `location`, `website`, `username`, `avatar`, `cover_photo`. Vậy ta cũng lưu các trường này vào schema `Users` với kiểu là `string`. `avatar`, `cover_photo` đơn giản chỉ là string url thôi. Đây là những giá trị optional, tức người dùng không nhập vào thì vẫn dùng bình thường. Nhưng cũng nên lưu set `''` khi người dùng không nhập gì để tiện quản lý

  (Khi upload không nên lưu ảnh vào database mà chỉ lưu url string)

- Cuối cùng là trường `created_at`, `updated_at` để biết thời gian tạo và cập nhập user. Vậy ta lưu thêm 2 trường này vào schema `Users` với kiểu `Date`. 2 trường này luôn luôn có giá trị

```ts
enum UserVerifyStatus {
  Unverified, // chưa xác thực email, mặc định = 0
  Verified, // đã xác thực emails
  Banned // bị khoá
}
interface User {
  _id: ObjectId
  name: string
  email: string
  date_of_birth: Date
  password: string
  created_at: Date
  updated_at: Date
  email_verify_token: string // jwt hoặc '' nếu đã xác thực email
  forgot_password_token: string //  jwt hoặc '' nếu đã xác thực email
  verify: UserVerifyStatus

  bio: string // optional
  location: string // optional
  website: string // optional
  username: string // optional
  avatar: string
  cover_photo: string
}
```

### Refresh_tokens

- Hệ thống sẽ dùng JWT để xác thực người dùng. Vậy mỗi lần người dùng đăng nhập thành công thì sẽ tạo ra 1 JWT access token và 1 refresh token

- JWT access token thì không cần lưu vào database, vì chúng sẽ cho nó stateless
- Còn refresh token thì cần lưu vào database để tăng tính bảo mật

Một user thì có thể có nhiều refresh token (Không giới hạn), nên không thể lưu hết vào trong collection `users` được => Quan hệ 1 - rất nhiều

Và đôi lúc chúng ta chỉ quan tâm đến refresh token mà không cần biết user là ai. Vậy nên ta tạo ra một collection riêng để lưu refresh token

```ts
interface RefreshToken {
  _id: ObjectId
  token: string
  created_at: string
  user_id: ObjectId
}
```

### Followers

- Một người dùng có thể follow rất nhiều user khác, nếu dùng 1 mảng `followings` chứa ObjectId trong collection `users` thì sẽ không tối ưu. Vì dễ chạm đến giới hạn 16MB của MongoDB
- Chưa hết, nếu dùng mảng `followings` thì khi muốn tìm kiếm user A đang follow ai rất dễ nhưng ngược lại, tìm kiếm ai đang follow user A thì rất khó

Vậy nên ta tạo ra một collection riêng để lưu các mối quan hệ follow giữa các user là hợp lý hơn cả 1 user có rất nhiều follower, và 1 follower cũng có rất nhiều user khác follow lại => Quan hệ rất nhiều - rất nhiều

```ts
interface Follower {
  _id: ObjectId
  user_id: ObjectId
  followed_user_id: ObjectId
  created_at: Date
}
```

### Tweets

1. Tweet có thể chứa text, hashtags, metions, ảnh, video
2. Tweet có thể hiển thị cho everyone hoặc twitter circle
3. Tweet có thể quy định người reply (everyone, người mà chúng ta follow, người mà chúng ta metion)

- Tweet sẽ có nested tweet, nghĩa là tweet có thể chứa tweet con bên trong. Nếu dùng theo kiểu nested object sẽ không phù hợp, vì sớm thôi, nó sẽ chạm đến giới hạn. Chưa kể query thông tin 1 tweet con rất khó

Vậy nên ta sẽ lưu trường `parent_id` để biết tweet này là con của ai. Nếu `parent_id` là `null` thì đó là tweet gốc

- Nếu là tweet bình thường thì sẽ có `content` là string. Còn nếu là retweet thì sẽ không có `content` mà chỉ có `parent_id` thôi, lúc này có thể cho `content` là `''` hoặc `null`. Nên để là `''` => `content` là `string`

> Nếu là '' thì sẽ chiếm bộ nhớ hơn là null, nhưng điều này là không đáng kể so với lợi ích nó đem lại

`audience` đại diện cho tính riêng tư của tweet. Ví dụ tweet có thể là public cho mọi người xem hoặc chỉ cho nhóm người nhất định. Vậy nên `visibility` có thể là `TweetAudience` enum

`type` đại diện cho loại tweet. Ví dụ tweet, retweet, quote tweet,...

`hashtags` là mảng chứa ObjectId của các hashtag. Vì mỗi tweet có thể có nhiều hashtag. Vậy nên `hashtag` có thể là `ObjectId`

`mentions` là mảng chứa ObjectId của các user được mention. Vì mỗi tweet có thể có nhiều user được mention. Vậy nên `mentions` có thể là `ObjectId[]`

`medias` là mảng chứa ObjectId của các media. Vì mỗi tweet chỉ có thể có 1 vài media. Nếu upload ảnh thì sẽ không upload được video và ngược lại. Vậy nên `medias` có thể là `Media[]`

Lượt view thì chúng ta chia ra làm 2 loại là `guest_views` là số lượng lượt xem của tweet từ người dùng không đăng nhập và `user_views` là dành cho đã đăng nhập. 2 trường này mình sẽ cho kiểu dữ liệu là `number`

```ts
interface Tweet {
  _id: ObjectId
  user_id: ObjectId
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | ObjectId // chỉ null khi tweet gốc
  hashtags: ObjectId[]
  mentions: ObjectId[]
  medias: Media[]
  guest_views: number
  user_views: number
  created_at: Date
  updated_at: Date
}
```

```ts
interface Media {
  url: string
  type: MediaType
}
enum MediaType {
  Image,
  Video
}
enum TweetAudience {
  Everyone,
  TwitterCircle
}
enum TweetType {
  Tweet,
  Retweet,
  Comment,
  QuoteTweet
}
```

### Validate Tweet Body

Để validate pass 100% case của tweet thì rất tốn thời gian, sẽ validate những case chính. Tất nhiên nó sẽ dính 1 số case hiếm gặp -> nếu phát hiện thì sẽ tự bổ sung thêm

- `type` phải là 1 trong 4 loại `TweetType`
- `audience` phải là trong 2 loại `TweetAudience`
- Nếu `type` là retweet, comment, quotetweet thì `parent_id` phải là `tweet_id` của tweet cha, nếu `type` là tweet thì `parent_id` phải là null
- Nếu `type` là retweet thì `content` phải là `''`. Nếu `type` là comment, quotetweet, tweet và không có `mentions` và `hashtags` thì `content` phải là string và không được rỗng
- `hashtag` phải là mảng các string
- `mentions` phải là mảng các string dạng id
- `medias` phải là mảng các `Media`

### Bookmarks

Bookmarks các tweet lại, mỗi user không giới hạn số lượng bookmark. Sở dĩ không cần `updated_at` là vì trong trường hợp người dùng unbookmark thì chúng ta sẽ xoá document này đi

```ts
interface Bookmark {
  _id: ObjectId
  user_id: ObjectId
  tweet_id: ObjectId
  created_at: Date
}
```

### likes

Tương tự như `bookmarks` thì chúng ta có collection `likes`

```ts
interface Like {
  _id: ObjectId
  user_id: ObjectId
  tweet_id: ObjectId
  created_at: Date
}
```

### hashtags

- Hỗ trợ tìm kiếm theo hashtag
- Mỗi tweet có thể có ít hashtag
- Mỗi hashtag có rất nhiều tweet

❌Không nên làm như dưới đây

```ts
interface Tweet {
  _id: ObjectId
  user_id: ObjectId
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | ObjectId
  ❌hashtags: string[] // Không nên nhúng như thế này, vì sẽ gây khó khăn trong việc tìm kiếm những tweet nào có hashtags này, cũng như là gây lặp lại dữ liệu về tên hashtag
  mentions: ObjectId[]
  medias: Media[]
  guest_views: number
  user_views: number
  created_at: Date
  updated_at: Date
}
```

=> Quan hệ ít - rất nhiều

- Lưu một array ObjectId `hashtags` trong collection `tweets`
- Tạo ra 1 collection riêng để lưu `hashtags` và không lưu mảng `tweet_id` vào trong collection `hashtags`. Vì nếu lưu `tweet_id` vào trong collection `hashtags` thì sẽ chạm đến giới hạn 16MB của MongoDB. Và cũng không cần thiết để lưu, vì khi search các tweet liên quan đến hashtag thì chúng ta sẽ dùng id hashtag để tìm kiếm trong collection `tweets`

```ts
interface Hashtag {
  _id: ObjectId
  name: string
  created_at: Date
}
```

## Luồng tạo 1 tweet

Ở đây sẽ giả sử một trường hợp tạo tweet đầy đủ hashtag, mention và media
Một body đầy đủ sẽ như thế nào

```ts
interface TweetRequestBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string // chỉ null khi tweet gốc, không thì là tweet_id cha dạng string
  hashtags: string[] // tên của hashtag dạng ['javascript','reactjs']
  mentions: string[] // string dạng user_id[]
  medias: Media[]
}
```

### Schema validate tweets

```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "title": "Tweets object validation",
    "required": [
      "_id",
      "user_id",
      "type",
      "audience",
      "content",
      "parent_id",
      "hashtags",
      "mentions",
      "medias",
      "guest_views",
      "user_views",
      "created_at",
      "updated_at"
    ],
    "properties": {
      "_id": {
        "bsonType": "objectId",
        "description": "'_id' must be a ObjectId and is required"
      },
      "user_id": {
        "bsonType": "objectId",
        "description": "'user_id' must be a ObjectId and is required"
      },
      "type": {
        "bsonType": "int",
        "enum": [0, 1, 2, 3],
        "description": "'type' must be a TweetType and is required"
      },
      "audience": {
        "bsonType": "int",
        "enum": [0, 1],
        "description": "'audience' must be a TweetAudience and is required"
      },
      "content": {
        "bsonType": "string",
        "description": "'content' must be a string and is required"
      },
      "parent_id": {
        "bsonType": ["null", "objectId"],
        "description": "'parent_id' must be a null or ObjectId and is required"
      },
      "hashtags": {
        "bsonType": "array",
        "uniqueItems": true,
        "additionalProperties": false,
        "items": {
          "bsonType": "objectId"
        },
        "description": "'hashtags' must be a array and is required"
      },
      "mentions": {
        "bsonType": "array",
        "uniqueItems": true,
        "additionalProperties": false,
        "items": {
          "bsonType": "objectId"
        },
        "description": "'mentions' must be a array and is required"
      },
      "medias": {
        "bsonType": "array",
        "uniqueItems": true,
        "additionalProperties": false,
        "items": {
          "bsonType": "object",
          "required": ["url", "type"],
          "additionalProperties": false,
          "properties": {
            "type": {
              "enum": [0, 1, 2],
              "description": "'type' is required and can only be one of the given enum values"
            },
            "url": {
              "bsonType": "string",
              "description": "'url' is a required field of type string"
            }
          }
        },
        "description": "'medias' must be a array and is required"
      },
      "guest_views": {
        "bsonType": "int",
        "minimum": 0,
        "description": "'guest_views' must be a ObjectId and is required"
      },
      "user_views": {
        "bsonType": "int",
        "minimum": 0,
        "description": "'user_views' must be a number and is required"
      },
      "created_at": {
        "bsonType": "date",
        "description": "'created_at' must be a date and is required"
      },
      "updated_at": {
        "bsonType": "date",
        "description": "'updated_at' must be a date and is required"
      }
    },
    "additionalProperties": false
  }
}
```
