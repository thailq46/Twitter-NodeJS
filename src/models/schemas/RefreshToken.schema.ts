import { ObjectId } from 'mongodb'

interface RefreshTokenType {
  _id?: ObjectId
  user_id: ObjectId
  token: string
  created_at?: Date
}

export default class RefreshToken {
  _id?: ObjectId
  token: string
  created_at: Date
  user_id: ObjectId

  constructor(refreshToken: RefreshTokenType) {
    const date = new Date()
    this._id = refreshToken._id
    this.user_id = refreshToken.user_id
    this.token = refreshToken.token
    this.created_at = refreshToken.created_at || date
  }
}
