import {Router} from 'express'
import {getConversationController} from '~/controllers/conversations.controllers'
import {accessTokenValidator, verifiedUserValidator} from '~/middlewares/users.middlewares'
import {wrapRequestHandler} from '~/utils/handlers'

const conversationsRoutes = Router()

conversationsRoutes.get(
  '/receivers/:receiverId',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getConversationController)
)

export default conversationsRoutes
