import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody } from '~/models/request/User.requests'
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
export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  try {
    const results = await usersService.register(req.body)
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
