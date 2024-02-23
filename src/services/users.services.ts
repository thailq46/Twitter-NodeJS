import User from '~/models/schemas/User.schema'
import databaseService from './database.services'

class UsersService {
  async register(payload: { email: string; password: string }) {
    try {
      const { email, password } = payload
      const result = await databaseService.users.insertOne(new User({ email, password }))
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
