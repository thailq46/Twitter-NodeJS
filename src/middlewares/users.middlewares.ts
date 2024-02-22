import { NextFunction, Request, Response } from 'express'

export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body as { email: string; password: string }
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }
  next()
}
