import { Request, Response, NextFunction } from 'express'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { USERS_MESSAGE } from '~/constants/messages'
import mediasService from '~/services/medias.services'

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * Cách fix 1 ESModule được sử dụng trong CommonJS (bản ta dùng là types@formidable v3 không phải v2 lên ko cần -> Nếu formidable là v3 và types@formidable là v2 thì cần sử dụng để không bị lỗi)
   * const formidable = (await import('formidable')).default
   */
  const url = await mediasService.uploadImage(req)
  return res.json({
    result: url,
    message: USERS_MESSAGE.UPLOAD_IMAGE_SUCCESS
  })
}

export const serveImageController = (req: Request, res: Response) => {
  const { name } = req.params
  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, name), (err) => {
    if (err) {
      return res.status((err as any).status).json({
        message: USERS_MESSAGE.IMAGE_NOT_FOUND
      })
    }
  })
}

export const serveVideoController = (req: Request, res: Response) => {
  const { name } = req.params
  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, name), (err) => {
    if (err) {
      return res.status((err as any).status).json({
        message: USERS_MESSAGE.VIDEO_NOT_FOUND
      })
    }
  })
}

export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediasService.uploadVideo(req)
  return res.json({
    result: url,
    message: USERS_MESSAGE.UPLOAD_VIDEO_SUCCESS
  })
}
