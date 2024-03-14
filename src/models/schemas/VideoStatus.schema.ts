import { ObjectId } from 'mongodb'
import { EncodingStatus } from '~/constants/enums'

interface VideoStatusType {
  _id?: ObjectId
  name: string
  status: EncodingStatus
  message?: string
  createdAt?: Date
  updatedAt?: Date
}

export default class VideoStatus {
  _id?: ObjectId
  name: string
  status: EncodingStatus
  message: string
  createdAt: Date
  updatedAt: Date
  constructor({ name, status, _id, message, createdAt, updatedAt }: VideoStatusType) {
    const date = new Date()
    this._id = _id
    this.name = name
    this.status = status
    this.message = message || ''
    this.createdAt = createdAt || date
    this.updatedAt = updatedAt || date
  }
}
