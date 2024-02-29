import { config } from 'dotenv'
import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { RegisterReqBody } from '~/models/request/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enums'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
config()
class UsersService {
  private async signAccessToken(user_id: string) {
    return await signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
    })
  }
  private async signRefreshToken(user_id: string) {
    return await signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken
      },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
    })
  }
  private signAccessTokenAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
  }
  async register(payload: RegisterReqBody) {
    // Khi tạo object User, khi truyền thừa dữ liệu vào new User thì constructor chỉ lấy dữ liêu cần thiết và bỏ qua dữ liệu thừa (Công dụng của class)
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    const user_id = result.insertedId.toString()
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken(user_id)
    // await databaseService.closeConnection()

    // Sau khi register new user thì insert refresh token của user vừa tạo vào database
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    )

    return {
      access_token,
      refresh_token
    }
  }

  async checkUserExists(email: string) {
    try {
      const user = await databaseService.users.findOne({ email })
      // console.log('checkUserExists', user)
      return Boolean(user)
    } catch (error) {
      console.log('Failed to check user exists', error)
    }
  }
  async login(user_id: string) {
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken(user_id)

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    )

    return {
      access_token,
      refresh_token
    }
  }
}

const usersService = new UsersService()
export default usersService
