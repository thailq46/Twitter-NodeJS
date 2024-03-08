import { Request, Response, NextFunction } from 'express'
import formidable from 'formidable'
import path from 'path'

export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * Cách fix 1 ESModule được sử dụng trong CommonJS (bản ta dùng là types@formidable v3 không phải v2 lên ko cần -> Nếu formidable là v3 và types@formidable là v2 thì cần sử dụng để không bị lỗi)
   * const formidable = (await import('formidable')).default
   */

  const form = formidable({
    uploadDir: path.resolve('uploads/images'),
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 800 * 1024 // 800KB
  })
  form.parse(req, (err, fields, files) => {
    if (err) {
      next(err)
      return
    }
    res.json({
      message: 'upload single image success',
      data: {
        fields,
        files
      }
    })
  })
}
