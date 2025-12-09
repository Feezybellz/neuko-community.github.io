import { ref, type Ref } from 'vue'

interface DraggableOptions {
    contentBounds: Ref<{ minX: number; minY: number; maxX: number; maxY: number }>
    canvasSize: Ref<number>
    updateVisibility: () => void
}

export function useDraggableCanvas(containerRef: Ref<HTMLElement | null>, options: DraggableOptions) {
    const isDragging = ref(false)
    const dragThresholdPassed = ref(false)
    const startX = ref(0)
    const startY = ref(0)
    const scrollLeft = ref(0)
    const scrollTop = ref(0)
    const scale = ref(1)

    function clampScroll(x: number, y: number) {
        if (!containerRef.value) return { x, y }
        const vw = window.innerWidth
        const vh = window.innerHeight
        const padding = 200

        const minX = options.contentBounds.value.minX - padding
        const maxX = options.contentBounds.value.maxX + padding - vw
        const minY = options.contentBounds.value.minY - padding
        const maxY = options.contentBounds.value.maxY + padding - vh

        return {
            x: Math.max(minX, Math.min(x, maxX)),
            y: Math.max(minY, Math.min(y, maxY))
        }
    }

    // --- Mouse Handlers ---
    const onMouseDown = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('.nav-button')) return
        isDragging.value = true
        dragThresholdPassed.value = false
        startX.value = e.pageX - (containerRef.value?.offsetLeft || 0)
        startY.value = e.pageY - (containerRef.value?.offsetTop || 0)
        scrollLeft.value = containerRef.value?.scrollLeft || 0
        scrollTop.value = containerRef.value?.scrollTop || 0
        if (containerRef.value) containerRef.value.style.cursor = 'grabbing'
    }

    const onMouseMove = (e: MouseEvent) => {
        if (!isDragging.value || !containerRef.value) return
        e.preventDefault()
        const x = e.pageX - (containerRef.value.offsetLeft || 0)
        const y = e.pageY - (containerRef.value.offsetTop || 0)
        const walkX = x - startX.value
        const walkY = y - startY.value

        if (Math.abs(walkX) > 5 || Math.abs(walkY) > 5) {
            dragThresholdPassed.value = true
        }

        const nextScrollLeft = scrollLeft.value - walkX
        const nextScrollTop = scrollTop.value - walkY

        const clamped = clampScroll(nextScrollLeft, nextScrollTop)
        containerRef.value.scrollLeft = clamped.x
        containerRef.value.scrollTop = clamped.y

        requestAnimationFrame(options.updateVisibility)
    }

    const onMouseUp = () => {
        isDragging.value = false
        if (containerRef.value) containerRef.value.style.cursor = 'grab'
    }

    // --- Touch Handlers ---
    const onTouchStart = (e: TouchEvent) => {
        if ((e.target as HTMLElement).closest('.nav-button')) return
        isDragging.value = true
        dragThresholdPassed.value = false
        const touch = e.touches[0]
        startX.value = touch.pageX - (containerRef.value?.offsetLeft || 0)
        startY.value = touch.pageY - (containerRef.value?.offsetTop || 0)
        scrollLeft.value = containerRef.value?.scrollLeft || 0
        scrollTop.value = containerRef.value?.scrollTop || 0
    }

    const onTouchMove = (e: TouchEvent) => {
        if (!isDragging.value || !containerRef.value) return
        if (e.touches.length > 1) return
        e.preventDefault()
        const touch = e.touches[0]
        const x = touch.pageX - (containerRef.value.offsetLeft || 0)
        const y = touch.pageY - (containerRef.value.offsetTop || 0)
        const walkX = x - startX.value
        const walkY = y - startY.value

        if (Math.abs(walkX) > 5 || Math.abs(walkY) > 5) {
            dragThresholdPassed.value = true
        }

        const nextScrollLeft = scrollLeft.value - walkX
        const nextScrollTop = scrollTop.value - walkY

        const clamped = clampScroll(nextScrollLeft, nextScrollTop)
        containerRef.value.scrollLeft = clamped.x
        containerRef.value.scrollTop = clamped.y

        requestAnimationFrame(options.updateVisibility)
    }

    const onTouchEnd = () => {
        isDragging.value = false
    }

    // --- Wheel/Zoom ---
    const onWheel = (e: WheelEvent) => {
        e.preventDefault()
        if (e.ctrlKey || e.metaKey) {
            const zoomSpeed = 0.002
            scale.value = Math.min(Math.max(scale.value - (e.deltaY * zoomSpeed), 0.3), 1.5)
            requestAnimationFrame(options.updateVisibility)
        } else {
            if (containerRef.value) {
                const nextX = containerRef.value.scrollLeft + e.deltaX
                const nextY = containerRef.value.scrollTop + e.deltaY
                const clamped = clampScroll(nextX, nextY)
                containerRef.value.scrollLeft = clamped.x
                containerRef.value.scrollTop = clamped.y
                requestAnimationFrame(options.updateVisibility)
            }
        }
    }

    const scrollToCenter = () => {
        if (containerRef.value) {
            const scrollX = (options.canvasSize.value - window.innerWidth) / 2
            const scrollY = (options.canvasSize.value - window.innerHeight) / 2
            containerRef.value.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' })
            options.updateVisibility()
        }
    }

    return {
        scale,
        isDragging,
        dragThresholdPassed,
        onMouseDown,
        onMouseMove,
        onMouseUp,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        onWheel,
        scrollToCenter
    }
}
