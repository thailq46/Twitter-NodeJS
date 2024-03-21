import {Router} from 'express'
import {getConversationController} from '~/controllers/conversations.controllers'
import {paginationValidator} from '~/middlewares/tweets.middlewares'
import {accessTokenValidator, getConversationValidator, verifiedUserValidator} from '~/middlewares/users.middlewares'
import {wrapRequestHandler} from '~/utils/handlers'

const conversationsRoutes = Router()

conversationsRoutes.get(
  '/receivers/:receiverId',
  accessTokenValidator,
  verifiedUserValidator,
  paginationValidator,
  getConversationValidator,
  wrapRequestHandler(getConversationController)
)

export default conversationsRoutes
