import { ObjectId } from 'mongodb'

interface RefreshTokenType {
  _id?: ObjectId
  user_id: ObjectId
  token: string
  created_at?: Date
  iat: number
  exp: number
}

export default class RefreshToken {
  _id?: ObjectId
  token: string
  created_at: Date
  user_id: ObjectId
  iat: Date
  exp: Date
  constructor({ _id, user_id, token, created_at, iat, exp }: RefreshTokenType) {
    const date = new Date()
    this._id = _id
    this.user_id = user_id
    this.token = token
    this.created_at = created_at || date
    this.iat = new Date(iat * 1000) // Convert Epoch time to Date
    this.exp = new Date(exp * 1000) // Convert Epoch time to Date
  }
}
