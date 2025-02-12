import { v2 as cloudinary } from 'cloudinary'

// Cloudinary yapılandırması
const config = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
}

// Yapılandırma kontrolü
if (!config.cloud_name || !config.api_key || !config.api_secret) {
  console.error('Cloudinary yapılandırması eksik:', {
    cloud_name: !!config.cloud_name,
    api_key: !!config.api_key,
    api_secret: !!config.api_secret,
  })
  throw new Error('Cloudinary yapılandırması eksik')
}

cloudinary.config(config)

export async function uploadImage(file: string): Promise<string> {
  try {
    console.log('Cloudinary yükleme başladı')
    const result = await cloudinary.uploader.upload(file, {
      folder: 'stofhamp',
      resource_type: 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    })
    console.log('Cloudinary yükleme tamamlandı:', result.secure_url)
    return result.secure_url
  } catch (error) {
    console.error('Cloudinary yükleme hatası:', error)
    if (error instanceof Error) {
      throw new Error(`Resim yükleme hatası: ${error.message}`)
    } else {
      throw new Error('Resim yüklenirken beklenmeyen bir hata oluştu')
    }
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  try {
    console.log('Cloudinary silme başladı:', publicId)
    await cloudinary.uploader.destroy(publicId)
    console.log('Cloudinary silme tamamlandı')
  } catch (error) {
    console.error('Cloudinary silme hatası:', error)
    if (error instanceof Error) {
      throw new Error(`Resim silme hatası: ${error.message}`)
    } else {
      throw new Error('Resim silinirken beklenmeyen bir hata oluştu')
    }
  }
} 