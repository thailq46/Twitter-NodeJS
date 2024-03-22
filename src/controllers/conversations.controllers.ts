import {Request, Response} from 'express'
import {GetConversationParams} from '~/models/request/Conversation.request'
import conversationService from '~/services/conversations.services'

export const getConversationController = async (req: Request<GetConversationParams>, res: Response) => {
  const sender_id = req.decoded_authorization?.user_id as string
  const {receiverId: receiver_id} = req.params
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const result = await conversationService.getConversations({
    sender_id,
    receiver_id,
    limit,
    page
  })
  return res.json({
    result: {
      conversations: result.conversations,
      limit,
      page,
      total_page: Math.ceil(result.total / limit)
    },
    message: 'Get conversation successfully'
  })
}
