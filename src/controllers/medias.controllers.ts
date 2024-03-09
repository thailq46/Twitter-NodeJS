import { Request, Response, NextFunction } from 'express'
import mediasService from '~/services/medias.services'

export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * Cách fix 1 ESModule được sử dụng trong CommonJS (bản ta dùng là types@formidable v3 không phải v2 lên ko cần -> Nếu formidable là v3 và types@formidable là v2 thì cần sử dụng để không bị lỗi)
   * const formidable = (await import('formidable')).default
   */
  const data = await mediasService.handleUploadSingleImage(req)
  return res.status(200).json({
    result: data
  })
}
