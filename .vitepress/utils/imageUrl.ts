import { CDN_CONFIG } from '../config/constants'

export function getMemeImageUrl(
    assetId: string,
    options?: { width?: number; format?: 'auto' | 'webp' | 'jpg' }
): string {
    if (!assetId) return ''
    const variant = options?.width
        ? `width=${options.width},fit=contain,format=${options.format || 'auto'}`
        : 'public'
    return `${CDN_CONFIG.baseUrl}/${CDN_CONFIG.accountId}/${assetId}/${variant}`
}
