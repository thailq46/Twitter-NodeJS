import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { RegisterReqBody } from '~/models/request/User.requests'
import { hashPassword } from '~/utils/crypto'

class UsersService {
  async register(payload: RegisterReqBody) {
    try {
      // Khi tạo object User, khi truyền thừa dữ liệu vào new User thì constructor chỉ lấy dữ liêu cần thiết và bỏ qua dữ liệu thừa (Công dụng của class)
      const result = await databaseService.users.insertOne(
        new User({
          ...payload,
          date_of_birth: new Date(payload.date_of_birth),
          password: hashPassword(payload.password)
        })
      )
      // await databaseService.closeConnection()
      return result
    } catch (error) {
      console.log('Failed to register', error)
    }
  }

  async checkUserExists(email: string) {
    try {
      const user = await databaseService.users.findOne({ email })
      console.log('checkUserExists', user)
      return Boolean(user)
    } catch (error) {
      console.log('Failed to check user exists', error)
    }
  }
}

const usersService = new UsersService()
export default usersService
