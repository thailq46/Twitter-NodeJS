import e, {Request, Response, NextFunction} from 'express'
import {validationResult, ValidationChain} from 'express-validator'
import {RunnableValidationChains} from 'express-validator/src/middlewares/schema'
import HTTP_STATUS from '~/constants/httpStatus'
import {EntityError, ErrorWithStatus} from '~/models/Errors'

// sequential processing, stops running validations chain if the previous one fails.
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // run all validations
    await validation.run(req)
    const errors = validationResult(req)

    // if there are no errors, continue
    if (errors.isEmpty()) {
      return next()
    }

    const errorsObject = errors.mapped()
    const entityError = new EntityError({errors: {}})
    console.log('errorsObject', errorsObject)

    for (const key in errorsObject) {
      const {msg} = errorsObject[key]
      // Trả về lỗi không phải là lỗi validate
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg)
      }
      entityError.errors[key] = errorsObject[key]
    }
    next(entityError)
  }
}
