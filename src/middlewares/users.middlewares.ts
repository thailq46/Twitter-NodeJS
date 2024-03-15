import {NextFunction, Request, Response} from 'express'
import {checkSchema} from 'express-validator'
import {JsonWebTokenError} from 'jsonwebtoken'
import HTTP_STATUS from '~/constants/httpStatus'
import {USERS_MESSAGE} from '~/constants/messages'
import {ErrorWithStatus} from '~/models/Errors'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import {hashPassword} from '~/utils/crypto'
import {verifyToken} from '~/utils/jwt'
import {validate} from '~/utils/validation'
import {capitalize} from 'lodash'
import {ObjectId} from 'mongodb'
import {TokenPayload} from '~/models/request/User.requests'
import {UserVerifyStatus} from '~/constants/enums'
import {REGEX_USERNAME} from '~/constants/regex'
import {
  nameCheckSchema,
  passwordCheckSchema,
  confirmPasswordCheckSchema,
  emailCheckSchema,
  dateOfBirthCheckSchema,
  oldPasswordCheckSchema
} from '~/constants/checkSchema'

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        ...emailCheckSchema,
        custom: {
          options: async (value, {req}) => {
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password)
            })
            if (user === null) {
              throw new Error(USERS_MESSAGE.EMAIL_OR_PASSWORD_INCORRECT)
            }
            req.user = user
            return true
          }
        }
      },
      password: passwordCheckSchema
    },
    ['body'] // Không truyền body thì mặc định checkSchema sẽ check full request ('body' | 'cookies' | 'headers' | 'params' | 'query') => giảm performance
  )
)

export const registerValidator = validate(
  checkSchema(
    {
      name: nameCheckSchema,
      email: {
        ...emailCheckSchema,
        custom: {
          options: async (value) => {
            const isExistEmail = await usersService.checkUserExists(value)
            if (isExistEmail) {
              throw new Error(USERS_MESSAGE.EMAIL_ALREADY_EXISTS)
            }
            return true
          }
        }
      },
      password: passwordCheckSchema,
      confirm_password: {
        ...confirmPasswordCheckSchema,
        custom: {
          options: (value, {req}) => {
            if (value !== req.body.password) {
              throw new Error(USERS_MESSAGE.PASSWORD_AND_CONFIRM_PASSWORD_DO_NOT_MATCH)
            }
            return true
          }
        }
      },
      date_of_birth: dateOfBirthCheckSchema
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        notEmpty: {
          errorMessage: USERS_MESSAGE.ACCESS_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, {req}) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGE.REFRESH_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            const access_token = (value || '').split(' ')[1]
            if (!access_token) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGE.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decoded_authorization = await verifyToken({
                token: access_token,
                serectOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
              })
              ;(req as Request).decoded_authorization = decoded_authorization
              return true
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        notEmpty: {
          errorMessage: USERS_MESSAGE.REFRESH_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, {req}) => {
            try {
              if (!value) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGE.REFRESH_TOKEN_IS_REQUIRED,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({
                  token: value,
                  serectOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
                }),
                databaseService.refreshTokens.findOne({
                  token: value
                })
              ])
              if (!refresh_token) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGE.USED_REFRESH_TOKEN_OR_NOT_EXISTS,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              ;(req as Request).decoded_refresh_token = decoded_refresh_token
              return true
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize(error.message),
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              throw error
            }
          }
        }
      }
    },
    ['body']
  )
)

export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        notEmpty: {
          errorMessage: USERS_MESSAGE.EMAIL_VERIFY_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, {req}) => {
            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                serectOrPublicKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
              })
              ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        ...emailCheckSchema,
        custom: {
          options: async (value, {req}) => {
            const user = await databaseService.users.findOne({
              email: value
            })
            if (user === null) {
              throw new Error(USERS_MESSAGE.USER_NOT_FOUND)
            }
            req.user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: {
        trim: true,
        custom: {
          options: async (value: string, {req}) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGE.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decoded_forgot_password_token = await verifyToken({
                token: value,
                serectOrPublicKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
              })
              const {user_id} = decoded_forgot_password_token
              const user = await databaseService.users.findOne({_id: new ObjectId(user_id)})
              if (!user) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGE.USER_NOT_FOUND,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              if (user.forgot_password_token !== value) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGE.INVALID_FORGOT_PASSWORD_TOKEN,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize(error.message),
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              throw error
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordCheckSchema,
      confirm_password: {
        ...confirmPasswordCheckSchema,
        custom: {
          options: (value, {req}) => {
            if (value !== req.body.password) {
              throw new Error(USERS_MESSAGE.PASSWORD_AND_CONFIRM_PASSWORD_DO_NOT_MATCH)
            }
            return true
          }
        }
      },
      forgot_password_token: {
        custom: {
          options: async (value: string, {req}) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGE.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decoded_forgot_password_token = await verifyToken({
                token: value,
                serectOrPublicKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
              })
              ;(req as Request).decoded_forgot_password_token = decoded_forgot_password_token
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const {verify} = req.decoded_authorization as TokenPayload
  if (verify !== UserVerifyStatus.Verified) {
    // Khi next 1 error thì sẽ chạy đến middleware error handler. Đây là middleware đồng bộ throw thì express validator tự động next giá trị throw (Chỉ áp dụng với synchronous)
    return next(
      new ErrorWithStatus({
        message: USERS_MESSAGE.USER_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    )
  }
  next()
}

export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        optional: true,
        ...nameCheckSchema
      },
      date_of_birth: {
        optional: true,
        ...dateOfBirthCheckSchema
      },
      bio: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGE.BIO_MUST_BE_A_STRING
        },
        isLength: {
          options: {min: 1, max: 200},
          errorMessage: USERS_MESSAGE.BIO_LENGTH_MUST_BE_FROM_1_TO_200
        },
        trim: true
      },
      location: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGE.LOCATION_MUST_BE_A_STRING
        },
        isLength: {
          options: {min: 1, max: 200},
          errorMessage: USERS_MESSAGE.LOCATION_LENGTH_MUST_BE_FROM_1_TO_200
        },
        trim: true
      },
      website: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGE.WEBSITE_MUST_BE_A_STRING
        },
        isLength: {
          options: {min: 1, max: 200},
          errorMessage: USERS_MESSAGE.WEBSITE_LENGTH_MUST_BE_FROM_1_TO_200
        },
        trim: true
      },
      username: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGE.USERNAME_MUST_BE_A_STRING
        },
        custom: {
          options: async (value: string, {req}) => {
            if (!REGEX_USERNAME.test(value)) {
              throw Error(USERS_MESSAGE.USERNAME_INVALID)
            }
            const user = await databaseService.users.findOne({
              username: value
            })
            // Nếu username đã tồn tại thì không cho phép update
            if (user) {
              throw new Error(USERS_MESSAGE.USERNAME_ALREADY_EXISTS)
            }
            return true
          }
        },
        trim: true
      },
      avatar: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGE.IMAGE_URL_MUST_BE_A_STRING
        },
        isLength: {
          options: {min: 1, max: 400},
          errorMessage: USERS_MESSAGE.IMAGE_URL_LENGTH
        },
        trim: true
      },
      cover_photo: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGE.IMAGE_URL_MUST_BE_A_STRING
        },
        isLength: {
          options: {min: 1, max: 400},
          errorMessage: USERS_MESSAGE.IMAGE_URL_LENGTH
        },
        trim: true
      }
    },
    ['body']
  )
)

export const followValidator = validate(
  checkSchema(
    {
      followed_user_id: {
        notEmpty: {
          errorMessage: USERS_MESSAGE.FOLLOW_USER_ID_IS_REQUIRED
        },
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
            if (!followed_user) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGE.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            return true
          }
        },
        trim: true
      }
    },
    ['body']
  )
)

export const unfollowValidator = validate(
  checkSchema(
    {
      user_id: {
        custom: {
          options: async (value: string, {req}) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGE.INVALID_USER_ID,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            const user = await databaseService.users.findOne({
              _id: new ObjectId(value)
            })
            if (!user) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGE.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            return true
          }
        },
        trim: true
      }
    },
    ['params']
  )
)

export const changePasswordValidator = validate(
  checkSchema(
    {
      old_password: {
        ...oldPasswordCheckSchema,
        custom: {
          options: async (value: string, {req}) => {
            const {user_id} = (req as Request).decoded_authorization as TokenPayload
            const user = await databaseService.users.findOne({
              _id: new ObjectId(user_id)
            })
            if (!user) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGE.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            const {password} = user
            if (password !== hashPassword(value)) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGE.OLD_PASSWORD_INCORRECT,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            return true
          }
        }
      },
      new_password: passwordCheckSchema,
      confirm_new_password: {
        ...confirmPasswordCheckSchema,
        custom: {
          options: (value: string, {req}) => {
            if (value !== req.body.new_password) {
              throw new Error(USERS_MESSAGE.PASSWORD_AND_CONFIRM_PASSWORD_DO_NOT_MATCH)
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)
