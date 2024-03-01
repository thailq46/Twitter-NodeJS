import User from '~/models/schemas/User.schema'
import { Request } from 'express'
import { JwtPayload } from 'jsonwebtoken'
import { TokenPayload } from '~/models/request/User.requests'

declare module 'express' {
  interface Request {
    user?: User
    decoded_authorization?: TokenPayload
    decoded_refresh_token?: TokenPayload
  }
}
