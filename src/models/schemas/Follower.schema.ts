import {ObjectId} from 'mongodb'

interface FollowerType {
  _id?: ObjectId
  user_id: ObjectId
  followed_user_id: ObjectId // kiểu mà được truyền vào constructor
  created_at?: Date
}

export default class Follower {
  _id?: ObjectId
  user_id: ObjectId
  followed_user_id: ObjectId // kiểu mà chúng ta gán
  created_at?: Date

  constructor({_id, followed_user_id, user_id, created_at}: FollowerType) {
    const date = new Date()
    this._id = _id
    this.user_id = user_id
    this.followed_user_id = followed_user_id
    this.created_at = created_at || date
  }
}
