import e, {Request, Response, NextFunction} from 'express'
import path from 'path'
import {UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR} from '~/constants/dir'
import HTTP_STATUS from '~/constants/httpStatus'
import {USERS_MESSAGE} from '~/constants/messages'
import mediasService from '~/services/medias.services'
import fs from 'fs'

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
  const {name} = req.params
  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, name), (err) => {
    if (err) {
      return res.status((err as any).status).json({
        message: USERS_MESSAGE.IMAGE_NOT_FOUND
      })
    }
  })
}

export const serveVideoStreamController = async (req: Request, res: Response) => {
  const mime = (await import('mime')).default

  const range = req.headers.range
  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Requires Range header')
  }
  const {name} = req.params
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name)
  // 1MB = 10^6 bytes (Tính theo hệ 10, đây là thứ chúng ta hay thấy trên UI)
  // Còn nếu tính theo hệ nhị phân thì 1MB = 2^20 bytes (1024 * 1024 bytes)

  // Dung lượng video
  const videoSize = fs.statSync(videoPath).size
  // Dung lượng video cho mỗi phân đoạn stream
  const CHUNK_SIZE = 10 ** 6 // 1MB
  // Lấy giá trị byte bắt đầu từ header Range (vd: bytes=1048567-)
  const start = Number(range.replace(/\D/g, ''))
  // Lấy giá trị byte kết thúc, vượt quá dung lượng video thì lấy videoSize
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1)
  // Dung lượng thực tế cho mỗi đoạn video stream
  // Thường đây sẽ là chunk size, ngoại trừ đoạn cuối cùng
  const contentLength = end - start + 1
  const contentType = mime.getType(videoPath) || 'video/*'
  const headers = {
    'Content-Range': `bytes ${start}-${end - 1}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers)
  const videoSteams = fs.createReadStream(videoPath, {start, end})
  videoSteams.pipe(res)
}

export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediasService.uploadVideo(req)
  return res.json({
    result: url,
    message: USERS_MESSAGE.UPLOAD_VIDEO_SUCCESS
  })
}

export const uploadVideoHLSController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediasService.uploadVideoHLS(req)
  return res.json({
    result: url,
    message: USERS_MESSAGE.UPLOAD_VIDEO_SUCCESS
  })
}
export const serveM3U8Controller = (req: Request, res: Response) => {
  const {id} = req.params
  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, 'master.m3u8'), (err) => {
    if (err) {
      return res.status((err as any).status).send(USERS_MESSAGE.VIDEO_NOT_FOUND)
    }
  })
}
export const serveSegmentController = (req: Request, res: Response) => {
  const {id, v, segment} = req.params
  // segment: 0.ts, 1.ts, 2.ts, ...
  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, v, segment), (err) => {
    if (err) {
      return res.status((err as any).status).send(USERS_MESSAGE.VIDEO_NOT_FOUND)
    }
  })
}

export const videoStatusController = async (req: Request, res: Response) => {
  const {id} = req.params
  const result = await mediasService.getVideoStatus(id as string)
  return res.json({
    message: USERS_MESSAGE.GET_VIDEO_STATUS_SUCCESS,
    result
  })
}
