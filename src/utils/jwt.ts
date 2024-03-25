import jwt, {SignOptions} from 'jsonwebtoken'
import {TokenPayload} from '~/models/request/User.requests'
import {envConfig} from '~/constants/config'

export function signToken({
  payload,
  privateKey = envConfig.jwtSecret,
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
  serectOrPublicKey = envConfig.jwtSecret
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
