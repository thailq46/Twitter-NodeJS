import jwt, { SignOptions } from 'jsonwebtoken'
import { config } from 'dotenv'
import { TokenPayload } from '~/models/request/User.requests'
config()

export function signToken({
  payload,
  privateKey = process.env.JWT_SECRET as string,
  options = {
    algorithm: 'HS256'
  }
}: {
  payload: string | Buffer | object
  privateKey?: string
  options?: SignOptions
}) {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (err, token) => {
      if (err) {
        throw reject(err)
      }
      resolve(token as string)
    })
  })
}

export const verifyToken = ({
  token,
  serectOrPublicKey = process.env.JWT_SECRET as string
}: {
  token: string
  serectOrPublicKey?: string
}) => {
  return new Promise<TokenPayload>((resolve, reject) => {
    jwt.verify(token, serectOrPublicKey, (err, decoded) => {
      if (err) {
        throw reject(err)
      }
      console.log('decoded', decoded)
      resolve(decoded as TokenPayload)
    })
  })
}
