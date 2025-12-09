import { shallowRef, type Ref } from 'vue'
import type { PositionedItem } from '../types'

interface VisibilityOptions {
    containerRef: Ref<HTMLElement | null>
    chunks: Map<string, PositionedItem[]>
    scale: Ref<number>
    chunkSize: number
    onCenterCheck?: () => void
}

export function useVisibilityCulling(options: VisibilityOptions) {
    const visibleItems = shallowRef<PositionedItem[]>([])

    function updateVisibility() {
        if (!options.containerRef.value) return

        const sL = options.containerRef.value.scrollLeft
        const sT = options.containerRef.value.scrollTop
        const vpW = window.innerWidth
        const vpH = window.innerHeight

        const effW = vpW / options.scale.value
        const effH = vpH / options.scale.value

        const startCX = Math.floor((sL - options.chunkSize) / options.chunkSize)
        const startCY = Math.floor((sT - options.chunkSize) / options.chunkSize)
        const endCX = Math.floor((sL + effW + options.chunkSize) / options.chunkSize)
        const endCY = Math.floor((sT + effH + options.chunkSize) / options.chunkSize)

        const gathered = new Set<PositionedItem>()

        for (let cx = startCX; cx <= endCX; cx++) {
            for (let cy = startCY; cy <= endCY; cy++) {
                const key = `${cx},${cy}`
                const chunkItems = options.chunks.get(key)
                if (chunkItems) {
                    chunkItems.forEach(item => gathered.add(item))
                }
            }
        }

        visibleItems.value = Array.from(gathered)

        if (options.onCenterCheck) {
            options.onCenterCheck()
        }
    }

    return {
        visibleItems,
        updateVisibility
    }
}
