import {Request, Response} from 'express'
import {TokenPayload} from '~/models/request/User.requests'
import conversationService from '~/services/conversations.services'

export const getConversationController = async (req: Request, res: Response) => {
  // const sender_id = req.decoded_authorization?.user_id as string
  const sender_id = '65e53611ca8d31f51c7fdccc'
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
