import User from '~/models/schemas/User.schema'
import databaseService from './database.services'

class UsersService {
  async register(payload: { email: string; password: string }) {
    try {
      const { email, password } = payload
      const result = await databaseService.users.insertOne(new User({ email, password }))
      await databaseService.closeConnection()
      return result
    } catch (error) {
      console.log('Failed to register', error)
    }
  }
}

const usersService = new UsersService()
export default usersService
