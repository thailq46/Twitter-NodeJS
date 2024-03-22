import HTTP_STATUS from '~/constants/httpStatus'
import databaseService from '~/services/database.services'
import Conversation from '~/models/schemas/Conversations.schema'
import {verifyAccessToken} from '~/utils/common'
import {UserVerifyStatus} from '~/constants/enums'
import {USERS_MESSAGE} from '~/constants/messages'
import {TokenPayload} from '~/models/request/User.requests'
import {Server} from 'socket.io'
import {Server as ServerHttp} from 'http'
import {ObjectId} from 'mongodb'
import {ErrorWithStatus} from '~/models/Errors'

export const initSocket = (httpServer: ServerHttp) => {
  const io = new Server(httpServer, {
    // Cấp phép cho domain có thể kết nối tới server
    cors: {origin: 'http://localhost:3000'}
  })
  const users: {
    [key: string]: {
      socket_id: string
    }
  } = {}
  io.use(async (socket, next) => {
    // Authorization sẽ truyền từ client sang cho server qua socket.auth
    const {Authorization} = socket.handshake.auth
    const access_token = (Authorization || '').split(' ')[1]
    try {
      const decoded_authorization = await verifyAccessToken(access_token)
      const {verify} = decoded_authorization as TokenPayload
      if (verify !== UserVerifyStatus.Verified) {
        // Khi throw 1 error nó nhảy xuống catch ở dưới và nó có nhiệm vụ next cho mình lên ở đây không cần next
        throw new ErrorWithStatus({
          message: USERS_MESSAGE.USER_NOT_VERIFIED,
          status: HTTP_STATUS.FORBIDDEN
        })
      }
      // Truyền decoded_authorization vào cho socket để sử dụng ở những event khác
      socket.handshake.auth.decoded_authorization = decoded_authorization
      socket.handshake.auth.access_token = access_token
      next()
    } catch (error) {
      next({
        message: 'Unauthorized',
        name: 'UnauthorizedError',
        data: error
      })
    }
  })

  /**
   * Khi có người dùng kết nối tới server thì sẽ tạo ra một socket_id ngẫu nhiên
   * VD: Có 2 người dùng kết nối tới server thì io.on('connection') sẽ tạo 2 socket_id ngẫu nhiên (Mỗi khi server running lại thì nó sẽ tạo ra socket_id mới)
   */
  io.on('connection', (socket) => {
    console.log(`user ${socket.id} connected`)
    const {user_id} = socket.handshake.auth.decoded_authorization as TokenPayload
    users[user_id] = {
      socket_id: socket.id
    }
    // Check if access_token expried
    socket.use(async (packet, next) => {
      const {access_token} = socket.handshake.auth
      try {
        await verifyAccessToken(access_token)
        next()
      } catch (error) {
        next(new Error('Unauthorized'))
      }
      socket.on('error', (error) => {
        if (error.message === 'Unauthorized') {
          socket.disconnect()
        }
      })
    })
    socket.on('send_message', async (data) => {
      const {receiver_id, sender_id, content} = data.payload
      // Lấy ra socket_id của người nhận
      const receiver_socket_id = users[receiver_id]?.socket_id

      const conversation = new Conversation({
        sender_id: new ObjectId(sender_id),
        receiver_id: new ObjectId(receiver_id),
        content: content
      })
      const result = await databaseService.conversations.insertOne(conversation)

      conversation._id = result.insertedId

      if (receiver_socket_id) {
        socket.to(receiver_socket_id).emit('receive_message', {
          payload: conversation
        })
      }
    })

    socket.on('disconnect', () => {
      delete users[user_id]
      console.log(`user ${socket.id} disconnected`)
    })
  })
}

export default initSocket
