import {MediaTypeQuery} from '~/constants/enums'
import {Pagination} from './Tweet.requests'
import {Query} from 'express-serve-static-core'

export enum PeopleFollow {
  Anyone = '0',
  Following = '1'
}

export interface SearchQuery extends Pagination, Query {
  content: string
  media_type?: MediaTypeQuery
  people_follow?: PeopleFollow
}
