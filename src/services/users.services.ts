import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import {RegisterReqBody, UpdateMeReqBody} from '~/models/request/User.requests'
import {hashPassword} from '~/utils/crypto'
import {signToken, verifyToken} from '~/utils/jwt'
import {TokenType, UserVerifyStatus} from '~/constants/enums'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import {ObjectId} from 'mongodb'
import {USERS_MESSAGE} from '~/constants/messages'
import {ErrorWithStatus} from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import Follower from '~/models/schemas/Follower.schema'
import axios from 'axios'
import {envConfig} from '~/constants/config'

class UsersService {
  private async signAccessToken({user_id, verify}: {user_id: string; verify: UserVerifyStatus}) {
    return await signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      },
      privateKey: envConfig.jwtSecretAccessToken,
      options: {expiresIn: envConfig.accessTokenExpiresIn}
    })
  }
  private async signRefreshToken({user_id, verify, exp}: {user_id: string; verify: UserVerifyStatus; exp?: number}) {
    if (exp) {
      return await signToken({
        payload: {
          user_id,
          token_type: TokenType.RefreshToken,
          verify,
          exp
        },
        privateKey: envConfig.jwtSecretRefreshToken
      })
    }
    return await signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      privateKey: envConfig.jwtSecretRefreshToken,
      options: {expiresIn: envConfig.refreshTokenExpiresIn}
    })
  }
  private signEmailVerifyToken({user_id, verify}: {user_id: string; verify: UserVerifyStatus}) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify
      },
      privateKey: envConfig.jwtSecretEmailVerifyToken,
      options: {expiresIn: envConfig.emailVerifyTokenExpiresIn}
    })
  }
  private signForgotPasswordToken({user_id, verify}: {user_id: string; verify: UserVerifyStatus}) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      privateKey: envConfig.jwtSecretForgotPasswordToken,
      options: {expiresIn: envConfig.forgotPasswordTokenExpiresIn}
    })
  }
  private signAccessTokenAndRefreshToken({user_id, verify}: {user_id: string; verify: UserVerifyStatus}) {
    return Promise.all([this.signAccessToken({user_id, verify}), this.signRefreshToken({user_id, verify})])
  }

  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      serectOrPublicKey: envConfig.jwtSecretRefreshToken
    })
  }

  async register(payload: RegisterReqBody) {
    // Khi tạo object User, khi truyền thừa dữ liệu vào new User thì constructor chỉ lấy dữ liêu cần thiết và bỏ qua dữ liệu thừa (Công dụng của class)
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    // await databaseService.closeConnection()
    const {iat, exp} = await this.decodeRefreshToken(refresh_token)
    // Sau khi register new user thì insert refresh token của user vừa tạo vào database
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({user_id: new ObjectId(user_id), token: refresh_token, iat, exp})
    )

    console.log('email_verify_token', email_verify_token)

    return {
      access_token,
      refresh_token
    }
  }

  async checkUserExists(email: string) {
    try {
      const user = await databaseService.users.findOne({email})
      // console.log('checkUserExists', user)
      return Boolean(user)
    } catch (error) {
      console.log('Failed to check user exists', error)
    }
  }
  private async getOAuthGoogleToken(code: string) {
    const body = {
      code,
      client_id: envConfig.googleClientId,
      client_secret: envConfig.googleClientSecret,
      redirect_uri: envConfig.googleRedirectUri,
      grant_type: 'authorization_code'
    }
    const {data} = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data as {
      access_token: string
      id_token: string
    }
  }

  private async getGoogleUserInfo(id_token: string, access_token: string) {
    const {data} = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })
    return data as {
      id: string
      email: string
      verified_email: boolean
      name: string
      given_name: string
      family_name: string
      picture: string
      locale: string
    }
  }

  async oauth(code: string) {
    // Nhận được code => gọi lên Google API để lấy id_token và access_token
    const {id_token, access_token} = await this.getOAuthGoogleToken(code)
    const userInfo = await this.getGoogleUserInfo(id_token, access_token)
    console.log(userInfo)
    // Check đã verify email chưa
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGE.GMAIL_NOT_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    // Check xem email đã tồn tại trong db chưa
    const user = await databaseService.users.findOne({email: userInfo.email})
    // Nếu tồn tại thì cho login vào
    if (user) {
      const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify
      })
      const {iat, exp} = await this.decodeRefreshToken(refresh_token)
      await databaseService.refreshTokens.insertOne(
        new RefreshToken({user_id: user._id, token: refresh_token, iat, exp})
      )
      return {
        access_token,
        refresh_token,
        newUser: 0,
        verify: user.verify
      }
    } else {
      const password = Math.random().toString(36).substring(2, 15)
      // Nếu chưa tồn tại thì tạo mới
      const data = await this.register({
        email: userInfo.email,
        name: userInfo.name,
        date_of_birth: new Date().toISOString(),
        password: hashPassword(password),
        confirm_password: hashPassword(password)
      })
      return {...data, newUser: 1, verify: UserVerifyStatus.Unverified}
    }
  }

  async login({user_id, verify}: {user_id: string; verify: UserVerifyStatus}) {
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({user_id, verify})

    const {iat, exp} = await this.decodeRefreshToken(refresh_token)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({user_id: new ObjectId(user_id), token: refresh_token, iat, exp})
    )

    return {
      access_token,
      refresh_token
    }
  }

  async logout(refresh_token: string) {
    const result = await databaseService.refreshTokens.deleteOne({token: refresh_token})
    return {
      message: USERS_MESSAGE.LOGOUT_SUCCESS,
      result
    }
  }

  async refreshToken({
    user_id,
    verify,
    refresh_token,
    exp
  }: {
    user_id: string
    verify: UserVerifyStatus
    refresh_token: string
    exp: number
  }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({user_id, verify}),
      this.signRefreshToken({user_id, verify, exp}),
      databaseService.refreshTokens.deleteOne({token: refresh_token})
    ])
    const decoded_refresh_token = await this.decodeRefreshToken(new_refresh_token)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: new_refresh_token,
        iat: decoded_refresh_token.iat,
        exp: decoded_refresh_token.exp
      })
    )
    return {
      new_access_token,
      new_refresh_token
    }
  }

  async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.signAccessTokenAndRefreshToken({user_id, verify: UserVerifyStatus.Verified}),
      databaseService.users.updateOne(
        {_id: new ObjectId(user_id)},
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified
            // (Chúng ta) Tạo giá trị cập nhập
            // updated_at: new Date()
          },
          // MongoDB cập nhập giá trị
          $currentDate: {
            updated_at: true
          }
        }
      )
    ])
    const [access_token, refresh_token] = token
    const {iat, exp} = await this.decodeRefreshToken(refresh_token)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({user_id: new ObjectId(user_id), token: refresh_token, iat, exp})
    )
    return {
      access_token,
      refresh_token
    }
  }

  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken({
      user_id,
      verify: UserVerifyStatus.Unverified
    })
    // Giả bộ gửi email
    console.log('email_verify_token', email_verify_token)
    // Cập nhập lại giá trị email_verify_token trong database
    await databaseService.users.updateOne(
      {_id: new ObjectId(user_id)},
      {
        $set: {
          email_verify_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: USERS_MESSAGE.RESEND_VERIFY_EMAIL_SUCCESS
    }
  }

  async forgotPassword({user_id, verify}: {user_id: string; verify: UserVerifyStatus}) {
    const forgot_password_token = await this.signForgotPasswordToken({user_id, verify})
    await databaseService.users.updateOne({_id: new ObjectId(user_id)}, [
      {
        $set: {
          forgot_password_token,
          updated_at: '$$NOW'
        }
      }
    ])
    // Giả bộ gửi email kèm đường link đến email người dùng: https://example.com/reset-password?token=<forgot_password_token>
    console.log('forgot_password_token', forgot_password_token)
    return {
      message: USERS_MESSAGE.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }

  async resetPassword(user_id: string, password: string) {
    databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            password: hashPassword(password),
            forgot_password_token: '',
            updated_at: '$$NOW'
          }
        }
      ]
    )
    return {
      message: USERS_MESSAGE.RESET_PASSWORD_SUCCESS
    }
  }

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      {_id: new ObjectId(user_id)},
      // Những field nào mà không muốn trả về cho user thì dùng projection để loại bỏ
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }

  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    const _payload = payload.date_of_birth ? {...payload, date_of_birth: new Date(payload.date_of_birth)} : payload
    const user = await databaseService.users.findOneAndUpdate(
      {_id: new ObjectId(user_id)},
      [
        {
          $set: {
            ...(_payload as UpdateMeReqBody & {date_of_birth?: Date}),
            updated_at: '$$NOW'
          }
        }
      ],
      {
        // Trả về document sau khi cập nhập
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }
  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      {username},
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          created_at: 0,
          updated_at: 0
        }
      }
    )
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGE.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return user
  }

  async follow(user_id: string, followed_user_id: string) {
    // Tìm xem đã follow hay chưa nếu rồi thì throw error
    const isFollowing = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (isFollowing === null) {
      const result = await databaseService.followers.insertOne(
        new Follower({
          user_id: new ObjectId(user_id),
          followed_user_id: new ObjectId(followed_user_id)
        })
      )
      return {
        message: USERS_MESSAGE.FOLLOW_SUCCESS,
        result
      }
    }
    return {
      message: USERS_MESSAGE.ALREADY_FOLLOWED
    }
  }
  async unfollow(user_id: string, followed_user_id: string) {
    // Tìm xem đã follow hay chưa nếu rồi thì throw error
    const isFollowing = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    // Không tìm thấy document follower nghĩa là chưa follow
    if (isFollowing === null) {
      return {
        message: USERS_MESSAGE.ALREADY_UNFOLLOWED
      }
    }
    // Tìm thấy document follower nghĩa là đã follow
    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    return {
      message: USERS_MESSAGE.UNFOLLOW_SUCCESS
    }
  }

  async changePassword(user_id: string, new_password: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            password: hashPassword(new_password),
            updated_at: '$$NOW'
          }
        }
      ]
    )
    return {
      message: USERS_MESSAGE.CHANGE_PASSWORD_SUCCESS
    }
  }
}
const usersService = new UsersService()
export default usersService
