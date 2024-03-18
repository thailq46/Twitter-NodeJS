import HTTP_STATUS from '~/constants/httpStatus'
import {USERS_MESSAGE} from '~/constants/messages'

type ErrorsType = Record<
  string,
  {
    msg: string
    [key: string]: any
  }
>

/**
 * Tạo ra file Errors.ts và tạo ra các class để trả về error đúng định dạng
 * Nếu mà  class ErrorWithStatus extends Error thì nếu extends Error thì express-validator thì sẽ chỉ nhận mỗi message, không nhận status
 */
export class ErrorWithStatus {
  message: string
  status: number
  constructor({message, status}: {message: string; status: number}) {
    this.message = message
    this.status = status
  }
}

// Dành cho lỗi validate
export class EntityError extends ErrorWithStatus {
  errors: ErrorsType
  constructor({message = USERS_MESSAGE.VALIDATION_ERROR, errors}: {message?: string; errors: ErrorsType}) {
    super({message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY})
    this.errors = errors
  }
}
