import {Request, Response, NextFunction} from 'express'
import {pick} from 'lodash'

type TypeFilterKeys<T> = Array<keyof T>

export const filterMiddleware =
  <T>(filterKeys: TypeFilterKeys<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys)
    next()
  }

/**
 * req.header vs req.headers
 * req.header: là header chung => người dùng truyền vào gì ta có thể nhận lại cái đấy và không phân biệt chữ hoa chữ thường
 * req.header('Authorization') === req.header('authorization')
 * req.headers: là header của express nó lấy ra từ req.header lên quy định chữ hoa và thường
 * req.headers.authorization !== req.headers.Authorization
 */
export const isUserLoggedInValidator = (middleware: (req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      return middleware(req, res, next)
    }
    next()
  }
}
