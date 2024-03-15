export enum UserVerifyStatus {
  Unverified, // chưa xác thực email, mặc định = 0
  Verified, // đã xác thực emails
  Banned // bị khoá
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerifyToken
}

export enum MediaType {
  Image,
  Video,
  HLS
}

export enum EncodingStatus {
  Pending, // Chờ ở hàng đợi
  Processing, // Đang encode
  Success, // Encode thành công
  Failed // Encode thất bại
}

export enum TweetType {
  Tweet, // Tweet gốc
  Retweet, // Retweet
  Comment, // Comment
  QuoteTweet // Quote
}

export enum TweetAudience {
  Everyone, // 0
  TwitterCircle // 1
}
