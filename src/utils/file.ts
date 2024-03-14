import { Request } from 'express'
import formidable, { File } from 'formidable'
import fs from 'fs'
import path from 'path'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'

const MAX_FILES_IMAGE = 4
const MAX_FILE_SIZE_IMAGE = 3000 * 1024
const MAX_TOTAL_FILE_SIZE_IMAGE = MAX_FILE_SIZE_IMAGE * MAX_FILES_IMAGE

const MAX_FILES_VIDEO = 1
const MAX_FILE_SIZE_VIDEO = 50 * 1024 * 1024

export const initFolder = () => {
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true // mục đích là để tạo folder nested
      })
    }
  })
}

// Tạo unique id cho video ngay từ đầu
// Upload video: Upload video thành công thì resolve về cho người dùng
// Encode video: Khai báo thêm 1 url endpoint để check xem video đó đã encode xong chưa
export const handleUploadImage = async (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_IMAGE_TEMP_DIR,
    maxFiles: MAX_FILES_IMAGE,
    maxFileSize: MAX_FILE_SIZE_IMAGE,
    maxTotalFileSize: MAX_TOTAL_FILE_SIZE_IMAGE,
    keepExtensions: true,
    filter: ({ name, originalFilename, mimetype }) => {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      // console.log('files', files)
      // console.log('fields', fields)
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        return reject(new Error('File is empty') as any)
      }
      resolve(files.image as File[])
    })
  })
}

export const getNameFromFullname = (fullname: string) => {
  const ext = path.extname(fullname)
  return path.basename(fullname, ext)
}

export const handleUploadVideo = async (req: Request) => {
  const nanoID = (await import('nanoid')).nanoid
  const idName = nanoID()
  const FOLDER_PATH = path.resolve(UPLOAD_VIDEO_DIR, idName)
  fs.mkdirSync(FOLDER_PATH)
  const form = formidable({
    uploadDir: FOLDER_PATH,
    maxFiles: MAX_FILES_VIDEO,
    maxFileSize: MAX_FILE_SIZE_VIDEO,
    filter: ({ name, originalFilename, mimetype }) => {
      const valid = (name === 'video' && Boolean(mimetype?.includes('mp4'))) || Boolean(mimetype?.includes('quicktime'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    },
    filename: () => idName
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.video)) {
        return reject(new Error('File is empty') as any)
      }
      const videos = files.video as File[]
      videos.forEach((video) => {
        const ext = getExtension(video.originalFilename as string)
        fs.renameSync(video.filepath, video.filepath + '.' + ext)
        video.newFilename = video.newFilename + '.' + ext
        video.filepath = video.filepath + '.' + ext
      })
      resolve(files.video as File[])
    })
  })
}

export const getExtension = (filename: string) => {
  const namearr = filename.split('.')
  return namearr[namearr.length - 1]
}
