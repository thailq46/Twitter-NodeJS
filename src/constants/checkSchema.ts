import {ParamSchema} from 'express-validator'
import {USERS_MESSAGE} from './messages'
import {ObjectId} from 'mongodb'
import {ErrorWithStatus} from '~/models/Errors'
import HTTP_STATUS from './httpStatus'
import databaseService from '~/services/database.services'

export const emailCheckSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGE.EMAIL_IS_REQUIRED
  },
  isEmail: {
    errorMessage: USERS_MESSAGE.EMAIL_INVALID
  },
  trim: true
}

export const passwordCheckSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGE.PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGE.PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {min: 6, max: 50},
    errorMessage: USERS_MESSAGE.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: USERS_MESSAGE.PASSWORD_MUST_BE_STRONG
  }
}

export const confirmPasswordCheckSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGE.CONFIRM_PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGE.CONFIRM_PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {min: 6, max: 50},
    errorMessage: USERS_MESSAGE.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: USERS_MESSAGE.CONFIRM_PASSWORD_MUST_BE_STRONG
  }
}

export const nameCheckSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGE.NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGE.NAME_MUST_BE_A_STRING
  },
  isLength: {
    options: {min: 1, max: 100},
    errorMessage: USERS_MESSAGE.NAME_LENGTH_MUST_BE_FROM_1_TO_100
  },
  trim: true
}

export const dateOfBirthCheckSchema: ParamSchema = {
  isISO8601: {
    options: {strict: true, strictSeparator: true},
    errorMessage: USERS_MESSAGE.DATE_OF_BIRTH_MUST_BE_ISO8601
  }
}

export const oldPasswordCheckSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGE.OLD_PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGE.OLD_PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {min: 6, max: 50},
    errorMessage: USERS_MESSAGE.OLD_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: USERS_MESSAGE.OLD_PASSWORD_MUST_BE_STRONG
  }
}

export const userIdSchema: ParamSchema = {
  custom: {
    options: async (value: string, {req}) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGE.INVALID_FOLLOWED_USER_ID,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      const followed_user = await databaseService.users.findOne({
        _id: new ObjectId(value)
      })

      if (followed_user === null) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGE.USER_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
    }
  }
}

export const imageSchema: ParamSchema = {
  // optinal không bắt buộc phải có trong body (có thể không gửi ảnh lên server, nếu gửi thì phải đúng định dạng string)
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGE.IMAGE_URL_MUST_BE_A_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 400
    },
    errorMessage: USERS_MESSAGE.IMAGE_URL_LENGTH
  }
}
