import fs from 'node:fs'
import path from 'node:path'

export interface Meme {
    id: string
    title: string
    type: 'IMAGE' | 'VIDEO'
    cf_asset_id: string
    slug: string
    status: string
    uploader: {
        username: string
        avatar_url?: string | null
    }
}

export declare const data: Meme[]

export default {
    watch: ['../../public/memes-archive.json'],
    load() {
        // Resolve path relative to this file
        // data/ is inside .vitepress/, so we go up twice to site root, then into public
        const jsonPath = path.resolve(__dirname, '../../public/memes-archive.json')
        try {
            const content = fs.readFileSync(jsonPath, 'utf-8')
            const json = JSON.parse(content)
            const all = json.memes || []
            // Filter out videos and gifs
            return all.filter((m: Meme) =>
                m.type !== 'VIDEO' &&
                !m.title.toLowerCase().endsWith('.mp4') &&
                !m.title.toLowerCase().endsWith('.webm') &&
                !m.title.toLowerCase().endsWith('.gif')
            )
        } catch (e) {
            console.error('Failed to load memes-archive.json', e)
            return []
        }
    }
}
