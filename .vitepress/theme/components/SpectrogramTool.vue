<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

// State
const audioFile = ref<File | null>(null)
const audioUrl = ref<string>('')
const isProcessing = ref(false)
const progress = ref(0)
const error = ref('')
const canvasRef = ref<HTMLCanvasElement | null>(null)
const audioPlayer = ref<HTMLAudioElement | null>(null)

// Spectrogram settings
const selectedColorScheme = ref('hot')
const fftSize = ref(1024) // default to medium resolution
const useLogFrequency = ref(false) // Use logarithmic frequency scale
const spectrogramDataCache = ref<number[][] | null>(null)
const minHz = ref(440) // frequency floor to keep upper bands visible
const maxHz = ref<number | null>(null) // null => Nyquist

// Proper color scheme implementations
const colorSchemes = {
  viridis: (value: number) => {
    // Proper viridis approximation (purple -> blue -> green -> yellow)
    value = Math.max(0, Math.min(1, value))
    if (value < 0.25) {
      // Purple to blue
      const t = value / 0.25
      return `rgb(${Math.floor(68 + (72 - 68) * t)}, ${Math.floor(1 + (40 - 1) * t)}, ${Math.floor(84 + (110 - 84) * t)})`
    } else if (value < 0.5) {
      // Blue to cyan
      const t = (value - 0.25) / 0.25
      return `rgb(${Math.floor(72 + (62 - 72) * t)}, ${Math.floor(40 + (74 - 40) * t)}, ${Math.floor(110 + (137 - 110) * t)})`
    } else if (value < 0.75) {
      // Cyan to green
      const t = (value - 0.5) / 0.25
      return `rgb(${Math.floor(62 + (33 - 62) * t)}, ${Math.floor(74 + (144 - 74) * t)}, ${Math.floor(137 + (141 - 137) * t)})`
    } else {
      // Green to yellow
      const t = (value - 0.75) / 0.25
      return `rgb(${Math.floor(33 + (253 - 33) * t)}, ${Math.floor(144 + (231 - 144) * t)}, ${Math.floor(141 + (37 - 141) * t)})`
    }
  },
  plasma: (value: number) => {
    // Plasma (dark purple -> purple -> pink -> yellow)
    value = Math.max(0, Math.min(1, value))
    if (value < 0.33) {
      const t = value / 0.33
      return `rgb(${Math.floor(13 + (72 - 13) * t)}, ${Math.floor(8 + (28 - 8) * t)}, ${Math.floor(135 + (135 - 135) * t)})`
    } else if (value < 0.66) {
      const t = (value - 0.33) / 0.33
      return `rgb(${Math.floor(72 + (180 - 72) * t)}, ${Math.floor(28 + (28 - 28) * t)}, ${Math.floor(135 + (75 - 135) * t)})`
    } else {
      const t = (value - 0.66) / 0.34
      return `rgb(${Math.floor(180 + (249 - 180) * t)}, ${Math.floor(28 + (230 - 28) * t)}, ${Math.floor(75 + (33 - 75) * t)})`
    }
  },
  inferno: (value: number) => {
    // Inferno (black -> red -> yellow)
    value = Math.max(0, Math.min(1, value))
    if (value < 0.5) {
      const t = value / 0.5
      return `rgb(${Math.floor(0 + (252 - 0) * t)}, ${Math.floor(0 + (78 - 0) * t)}, ${Math.floor(4 + (42 - 4) * t)})`
    } else {
      const t = (value - 0.5) / 0.5
      return `rgb(${Math.floor(252 + (252 - 252) * t)}, ${Math.floor(78 + (211 - 78) * t)}, ${Math.floor(42 + (164 - 42) * t)})`
    }
  },
  hot: (value: number) => {
    // Hot (black -> red -> yellow -> white)
    value = Math.max(0, Math.min(1, value))
    if (value < 0.33) {
      const t = value / 0.33
      const v = Math.floor(t * 255)
      return `rgb(${v}, 0, 0)`
    } else if (value < 0.66) {
      const t = (value - 0.33) / 0.33
      return `rgb(255, ${Math.floor(t * 255)}, 0)`
    } else {
      const t = (value - 0.66) / 0.34
      const v = Math.floor(255 * t)
      return `rgb(255, 255, ${v})`
    }
  },
  cool: (value: number) => {
    // Cool (cyan -> magenta)
    value = Math.max(0, Math.min(1, value))
    return `rgb(${Math.floor(value * 255)}, ${Math.floor((1 - value) * 255)}, 255)`
  },
  grayscale: (value: number) => {
    const v = Math.floor(Math.max(0, Math.min(1, value)) * 255)
    return `rgb(${v}, ${v}, ${v})`
  }
}

let audioContext: AudioContext | null = null
const audioBuffer = ref<AudioBuffer | null>(null)

// Handle file upload
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  if (!file.type.startsWith('audio/')) {
    error.value = 'Please upload an audio file'
    return
  }

  audioFile.value = file
  error.value = ''
  isProcessing.value = true
  progress.value = 0

  // Create object URL for audio player
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
  }
  audioUrl.value = URL.createObjectURL(file)

  try {
    // Load and process audio
    await processAudioFile(file)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to process audio file'
    console.error('Error processing audio:', err)
  } finally {
    isProcessing.value = false
  }
}

// Process audio file and generate spectrogram
const processAudioFile = async (file: File) => {
  // Initialize audio context
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  audioContext = new AudioContextClass()

  // Read file as array buffer
  const arrayBuffer = await file.arrayBuffer()

  // Decode audio data
  progress.value = 30
  audioBuffer.value = await audioContext.decodeAudioData(arrayBuffer)
  progress.value = 50

  // Generate spectrogram
  await generateSpectrogram()
  progress.value = 100
}

// Generate spectrogram from audio buffer using Web Audio API
const generateSpectrogram = async () => {
  if (!audioBuffer.value || !canvasRef.value) return

  isProcessing.value = true
  spectrogramDataCache.value = null

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const duration = audioBuffer.value.duration
  const numberOfChannels = audioBuffer.value.numberOfChannels

  // Use first channel (or mix down if stereo)
  let channelData: Float32Array
  if (numberOfChannels > 1) {
    // Mix down to mono
    const left = audioBuffer.value.getChannelData(0)
    const right = audioBuffer.value.getChannelData(1)
    channelData = new Float32Array(left.length)
    for (let i = 0; i < left.length; i++) {
      channelData[i] = (left[i] + right[i]) / 2
    }
  } else {
    channelData = audioBuffer.value.getChannelData(0)
  }

  // Calculate dimensions - higher resolution for better detail
  const pixelsPerSecond = 200 // Higher resolution to match Audacity quality
  // Add a small padding so the final columns (e.g., QR) are not clipped
  const width = Math.min(3000, Math.ceil(duration * pixelsPerSecond) + 64)
  const frequencyBinCount = fftSize.value / 2
  // Use full vertical resolution so high-frequency details (e.g. QR code) are not clipped
  const height = frequencyBinCount

  canvas.width = width
  canvas.height = height

  // Set canvas display size
  const maxDisplayHeight = 800
  const maxDisplayWidth = 1200
  const aspectRatio = width / height

  if (width > maxDisplayWidth) {
    canvas.style.width = `${maxDisplayWidth}px`
    canvas.style.height = `${maxDisplayWidth / aspectRatio}px`
  } else if (height > maxDisplayHeight) {
    canvas.style.height = `${maxDisplayHeight}px`
    canvas.style.width = `${maxDisplayHeight * aspectRatio}px`
  } else {
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
  }

  // Clear canvas
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)

  // Process audio using efficient windowed FFT with hopSize
  const windowSize = fftSize.value
  // Use 75% overlap (hopSize = fftSize / 4) for better temporal resolution
  const hopSize = Math.floor(windowSize / 4)

  // Store all frequency data with time positions
  // Structure: { time: number (in samples), data: number[] }[]
  const frames: Array<{ time: number; data: number[] }> = []

  // Compute frames by hopSize
  const totalSamples = channelData.length
  let frameCount = 0
  for (let sampleIndex = 0; sampleIndex < totalSamples - windowSize; sampleIndex += hopSize) {
    const windowStart = sampleIndex
    const windowEnd = Math.min(totalSamples, sampleIndex + windowSize)
    const actualWindowSize = windowEnd - windowStart

    if (actualWindowSize >= windowSize / 4) {
      // Extract and window the samples
      const window = channelData.slice(windowStart, windowEnd)
      const windowedSamples = new Float32Array(windowSize)

      // Apply Hann window
      for (let i = 0; i < actualWindowSize; i++) {
        const windowValue = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (windowSize - 1)))
        windowedSamples[i] = window[i] * windowValue
      }

      // Perform FFT
      const fftResult = performFFT(windowedSamples)
      frames.push({
        time: sampleIndex + windowSize / 2, // Center of window
        data: Array.from(fftResult)
      })
    }

    frameCount++
    // Update progress
    if (frameCount % 50 === 0) {
      const estimatedTotalFrames = Math.ceil((totalSamples - windowSize) / hopSize)
      progress.value = 50 + (frameCount / estimatedTotalFrames) * 50
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  // Map frames to pixels - create spectrogramData array indexed by pixel column
  const spectrogramData: number[][] = new Array(width)
  const samplesPerPixel = channelData.length / width

  // Since frames are sorted by time, we can efficiently map them to pixels
  let frameIndex = 0
  for (let x = 0; x < width; x++) {
    const targetSampleTime = x * samplesPerPixel

    // Find the frame closest to this pixel's time position
    // Since frames are sorted, we can advance frameIndex as we go
    while (
      frameIndex < frames.length - 1 &&
      Math.abs(frames[frameIndex + 1].time - targetSampleTime) <
        Math.abs(frames[frameIndex].time - targetSampleTime)
    ) {
      frameIndex++
    }

    // Use the nearest frame
    if (frames[frameIndex]) {
      spectrogramData[x] = frames[frameIndex].data
    } else {
      spectrogramData[x] = new Array(frequencyBinCount).fill(0)
    }
  }

  spectrogramDataCache.value = spectrogramData
  drawSpectrogram()
  isProcessing.value = false
}

// Efficient FFT implementation using Cooley-Tukey algorithm
const performFFT = (samples: Float32Array): Float32Array => {
  const N = samples.length

  // FFT size should already be a power of 2, but ensure it is
  if ((N & (N - 1)) !== 0) {
    // Not a power of 2, pad to next power of 2
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(N)))
    const paddedSamples = new Float32Array(nextPowerOf2)
    paddedSamples.set(samples)
    return performFFT(paddedSamples)
  }

  // Perform FFT
  const fft = fftRadix2(samples)

  // Return only first half (up to Nyquist frequency) as magnitude
  const output = new Float32Array(N / 2)
  for (let i = 0; i < N / 2; i++) {
    const real = fft[i * 2]
    const imag = fft[i * 2 + 1]
    // Magnitude, normalized by N
    output[i] = Math.sqrt(real * real + imag * imag) / N
  }

  return output
}

const drawSpectrogram = () => {
  if (!canvasRef.value || !spectrogramDataCache.value) return
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const spectrogramData = spectrogramDataCache.value
  const width = canvas.width
  const height = canvas.height
  const frequencyBinCount = spectrogramData[0]?.length ?? 0
  if (!frequencyBinCount) return
  const sr = audioBuffer.value?.sampleRate ?? 44100
  const nyquist = sr / 2
  const maxHzVal = Math.max(minHz.value, maxHz.value ?? nyquist)
  const binHz = sr / fftSize.value

  const imageData = ctx.createImageData(width, height)
  const data = imageData.data
  const minFreqHz = minHz.value
  const maxFreqHz = Math.min(maxHzVal, nyquist)

  for (let x = 0; x < width; x++) {
    const column = spectrogramData[x] || []

    for (let y = 0; y < height; y++) {
      let freqIndex: number

      if (useLogFrequency.value) {
        const t = (height - 1 - y) / (height - 1)
        const hz = minFreqHz * Math.pow(maxFreqHz / minFreqHz, t)
        freqIndex = Math.round(hz / binHz)
      } else {
        const t = (height - 1 - y) / (height - 1)
        const hz = minFreqHz + t * (maxFreqHz - minFreqHz)
        freqIndex = Math.round(hz / binHz)
      }

      const clampedFreqIndex = Math.max(0, Math.min(frequencyBinCount - 1, freqIndex))
      const magnitude = column[clampedFreqIndex] || 0

      const db = 20 * Math.log10(magnitude + 1e-12)
      const minDb = -100
      const maxDb = -20
      const clampedValue = Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb)))

      const color =
        colorSchemes[selectedColorScheme.value as keyof typeof colorSchemes](clampedValue)
      const rgbMatch = color.match(/\d+/g)
      if (rgbMatch && rgbMatch.length >= 3) {
        const idx = (y * width + x) * 4
        data[idx] = parseInt(rgbMatch[0])
        data[idx + 1] = parseInt(rgbMatch[1])
        data[idx + 2] = parseInt(rgbMatch[2])
        data[idx + 3] = 255
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)

  // Frequency tick labels (right aligned)
  ctx.save()
  ctx.font = '12px system-ui'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'

  const ticks = [minFreqHz, 5000, 10000, 15000, 19000, Math.floor(maxFreqHz)]
  for (const hz of ticks) {
    if (hz < minFreqHz || hz > maxFreqHz) continue
    const t = useLogFrequency.value
      ? Math.log(hz / minFreqHz) / Math.log(maxFreqHz / minFreqHz)
      : (hz - minFreqHz) / (maxFreqHz - minFreqHz)
    const y = height - 1 - t * (height - 1)
    const label = hz >= 1000 ? `${(hz / 1000).toFixed(1)} kHz` : `${hz} Hz`
    ctx.fillText(label, width - 6, y)
  }
  ctx.restore()
}

// Radix-2 FFT implementation
const fftRadix2 = (x: Float32Array): Float32Array => {
  const N = x.length

  // Base case
  if (N <= 1) {
    return new Float32Array([x[0], 0])
  }

  // Divide
  const even = new Float32Array(N / 2)
  const odd = new Float32Array(N / 2)

  for (let i = 0; i < N / 2; i++) {
    even[i] = x[i * 2]
    odd[i] = x[i * 2 + 1]
  }

  // Conquer
  const evenFFT = fftRadix2(even)
  const oddFFT = fftRadix2(odd)

  // Combine
  const result = new Float32Array(N * 2) // [real, imag, real, imag, ...]

  for (let k = 0; k < N / 2; k++) {
    const angle = (-2 * Math.PI * k) / N
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    const oddReal = oddFFT[k * 2]
    const oddImag = oddFFT[k * 2 + 1]

    const tReal = oddReal * cos - oddImag * sin
    const tImag = oddReal * sin + oddImag * cos

    const evenReal = evenFFT[k * 2]
    const evenImag = evenFFT[k * 2 + 1]

    // X[k] = E[k] + t
    result[k * 2] = evenReal + tReal
    result[k * 2 + 1] = evenImag + tImag

    // X[k + N/2] = E[k] - t
    result[(k + N / 2) * 2] = evenReal - tReal
    result[(k + N / 2) * 2 + 1] = evenImag - tImag
  }

  return result
}

// Download spectrogram as image
const downloadSpectrogram = () => {
  if (!canvasRef.value) return

  const link = document.createElement('a')
  link.download = `spectrogram-${Date.now()}.png`
  link.href = canvasRef.value.toDataURL('image/png')
  link.click()
}

// Clear/reset
const clearAll = () => {
  audioFile.value = null
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = ''
  }
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
  audioBuffer.value = null
  error.value = ''
  progress.value = 0

  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    }
  }
}

onUnmounted(() => {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
  }
  if (audioContext) {
    audioContext.close()
  }
})
</script>

<template>
  <div class="spectrogram-container">
    <div class="tool-header">
      <div class="header-info">
        <span class="tool-icon">📊</span>
        <div>
          <h2 class="tool-title">Spectrogram Analyzer</h2>
          <p class="tool-desc">Visualize frequency content over time in audio files</p>
        </div>
      </div>
    </div>

    <div class="upload-section">
      <input
        type="file"
        @change="handleFileUpload"
        accept="audio/*"
        id="audio-upload"
        class="file-input"
      />
      <label for="audio-upload" class="upload-button">
        {{ audioFile ? '📁 Change Audio File' : '📁 Upload Audio File' }}
      </label>

      <div v-if="audioFile" class="file-info">
        <span class="file-name">{{ audioFile.name }}</span>
        <span v-if="audioBuffer" class="file-duration">
          Duration: {{ audioBuffer.duration.toFixed(2) }}s
        </span>
      </div>
    </div>

    <div v-if="isProcessing" class="processing-indicator">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      <p class="progress-text">Processing audio... {{ Math.floor(progress) }}%</p>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="audioFile && !isProcessing" class="controls-section">
      <div class="audio-player-wrapper">
        <audio ref="audioPlayer" :src="audioUrl" controls class="audio-player"></audio>
      </div>

      <div class="settings-panel">
        <div class="setting-group">
          <label class="setting-label">Color Scheme:</label>
          <div class="color-scheme-selector">
            <button
              v-for="(scheme, name) in colorSchemes"
              :key="name"
              @click="
                () => {
                  selectedColorScheme = name
                  spectrogramDataCache
                    ? drawSpectrogram()
                    : audioBuffer
                      ? generateSpectrogram()
                      : null
                }
              "
              :class="['color-btn', { active: selectedColorScheme === name }]"
              :title="name"
            >
              <div
                class="color-preview"
                :style="{
                  background: `linear-gradient(to right, ${scheme(0)}, ${scheme(0.5)}, ${scheme(1)})`
                }"
              ></div>
              <span class="color-name">{{ name }}</span>
            </button>
          </div>
        </div>

        <div class="setting-group">
          <label class="setting-label">FFT Size:</label>
          <select
            v-model.number="fftSize"
            class="setting-select"
            @change="
              () => {
                if (audioBuffer) generateSpectrogram()
              }
            "
          >
            <option :value="512">512 (Low Resolution)</option>
            <option :value="1024">1024 (Medium Resolution)</option>
            <option :value="2048">2048 (High Resolution)</option>
            <option :value="4096">4096 (Very High Resolution)</option>
          </select>
        </div>

        <div class="setting-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="useLogFrequency"
              @change="
                () => {
                  spectrogramDataCache
                    ? drawSpectrogram()
                    : audioBuffer
                      ? generateSpectrogram()
                      : null
                }
              "
            />
            <span>Logarithmic Frequency Scale</span>
          </label>
        </div>

        <button @click="downloadSpectrogram" class="action-button" :disabled="!audioBuffer">
          💾 Download Spectrogram
        </button>
        <button @click="clearAll" class="action-button secondary">🗑️ Clear</button>
      </div>
    </div>

    <div class="canvas-wrapper">
      <canvas ref="canvasRef" class="spectrogram-canvas"></canvas>
      <div v-if="!audioFile" class="canvas-placeholder">
        <div class="placeholder-icon">🎵</div>
        <p>Upload an audio file to generate a spectrogram</p>
      </div>
    </div>

    <div class="tool-footer">
      <p>
        Spectrograms visualize frequency content over time. Higher intensity colors represent
        stronger frequency components at that moment.
      </p>
    </div>
  </div>
</template>

<style scoped>
.spectrogram-container {
  background: var(--vp-c-bg-soft);
  border-radius: 28px;
  padding: 25px;
  border: 1px solid var(--vp-c-divider);
  margin-top: 2rem;
}

.tool-header {
  margin-bottom: 25px;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.tool-icon {
  font-size: 1.8rem;
  background: var(--vp-c-bg-mute);
  padding: 10px;
  border-radius: 15px;
}

.tool-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--vp-c-text-1);
}

.tool-desc {
  margin: 0;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}

.upload-section {
  margin-bottom: 20px;
}

.file-input {
  display: none;
}

.upload-button {
  display: inline-block;
  background: var(--vp-c-brand-1);
  color: #000;
  padding: 12px 24px;
  border-radius: 100px;
  font-weight: 800;
  font-size: 11px;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
}

.upload-button:hover {
  opacity: 0.8;
}

.file-info {
  margin-top: 12px;
  display: flex;
  gap: 15px;
  align-items: center;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.file-name {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.file-duration {
  color: var(--vp-c-text-3);
}

.processing-indicator {
  margin-bottom: 20px;
  padding: 20px;
  background: var(--vp-c-bg-mute);
  border-radius: 12px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: var(--vp-c-brand-1);
  transition: width 0.3s;
}

.progress-text {
  margin: 0;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  text-align: center;
}

.error-message {
  margin-bottom: 20px;
  padding: 12px;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 8px;
  color: #ff6b6b;
  font-size: 0.9rem;
}

.controls-section {
  margin-bottom: 20px;
  padding: 20px;
  background: var(--vp-c-bg-mute);
  border-radius: 20px;
  border: 1px solid var(--vp-c-divider);
}

.audio-player-wrapper {
  margin-bottom: 20px;
}

.audio-player {
  width: 100%;
  height: 40px;
  border-radius: 100px;
}

.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--vp-c-divider);
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.setting-label {
  font-size: 10px;
  font-weight: 800;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-weight: 600;
}

.checkbox-label input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.color-scheme-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.color-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--vp-c-bg-soft);
  border: 2px solid var(--vp-c-divider);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn:hover {
  border-color: var(--vp-c-brand-1);
}

.color-btn.active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.color-preview {
  width: 60px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid var(--vp-c-divider);
}

.color-name {
  font-size: 9px;
  font-weight: 700;
  color: var(--vp-c-text-2);
  text-transform: capitalize;
}

.color-btn.active .color-name {
  color: var(--vp-c-brand-1);
}

.setting-select {
  padding: 10px 14px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  cursor: pointer;
}

.action-button {
  padding: 10px 20px;
  background: var(--vp-c-brand-1);
  color: #000;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.action-button:hover:not(:disabled) {
  opacity: 0.8;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button.secondary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.canvas-wrapper {
  position: relative;
  background: #000;
  border-radius: 20px;
  overflow: scroll;
  border: 2px solid #1a1a1a;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  min-height: 300px;
  display: block;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.spectrogram-canvas {
  display: block;
  width: 100%;
  height: auto;
  image-rendering: auto;
}

.canvas-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--vp-c-text-3);
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 10px;
}

.canvas-placeholder p {
  margin: 0;
  font-size: 0.9rem;
}

.tool-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  text-align: center;
}

@media (max-width: 640px) {
  .color-scheme-selector {
    justify-content: center;
  }

  .settings-panel {
    gap: 15px;
  }
}
</style>
