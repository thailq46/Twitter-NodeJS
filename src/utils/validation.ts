import { Request, Response, NextFunction } from 'express'
import { validationResult, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'

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
    res.status(400).json({ errors: errors.mapped() })
  }
}
