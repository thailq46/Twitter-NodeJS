import { Request, Response } from 'express'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email === 'lequangthai@gmail.com' && password === '123456') {
    return res.json({
      message: 'Login successful',
      data: req.body
    })
  }
  return res.status(401).json({
    message: 'Email or password is incorrect'
  })
}
export const registerController = async (req: Request, res: Response) => {
  const { email, password } = req.body
  try {
    const results = await usersService.register({ email, password })
    return res.json({
      message: 'Register successful',
      results
    })
  } catch (error: any) {
    return res.status(400).json({
      message: 'Register failed',
      error: error.message
    })
  }
}
