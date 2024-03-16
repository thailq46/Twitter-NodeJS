import {Request, Response, NextFunction, RequestHandler} from 'express'

export const wrapRequestHandler = <T extends Record<string, any>>(handler: RequestHandler<T, any, any, any>) => {
  return async (req: Request<T>, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next)
    } catch (error: any) {
      next(error)
    }
  }
}
