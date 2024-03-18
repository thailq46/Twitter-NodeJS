import {Request, Response} from 'express'
import {ParamsDictionary} from 'express-serve-static-core'
import {SEARCH_MESSAGES} from '~/constants/messages'
import {SearchQuery} from '~/models/request/Search.request'
import {TokenPayload} from '~/models/request/User.requests'
import searchService from '~/services/search.services'

export const searchController = async (req: Request<ParamsDictionary, any, any, SearchQuery>, res: Response) => {
  const {user_id} = req.decoded_authorization as TokenPayload
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const media_type = req.query.media_type
  const people_follow = req.query.people_follow
  const result = await searchService.search({
    content: req.query.content,
    limit,
    page,
    media_type,
    people_follow,
    user_id
  })
  return res.json({
    message: SEARCH_MESSAGES.SEARCH_SUCCESSFULLY,
    result
  })
}
