<script setup>
import { ref, onUnmounted } from 'vue'

// --- State ---
const activeTab = ref('audio')
const currentHeatmap = ref('cyber')
const canvasRef = ref(null)
const audioPlayer = ref(null)
const decodedText = ref('')
const zwText = ref('')
const zwDecoded = ref('')
const isAudioLoaded = ref(false)

let audioCtx = null
let analyser = null
let animationId = null
let source = null

const heatmaps = {
  cyber: (v) => `rgb(${v}, ${v / 2}, 255)`,
  classic: (v) => `rgb(0, ${v}, 0)`,
  magma: (v) => `rgb(${v}, ${v / 4}, 0)`,
  ghost: (v) => `rgb(${v}, ${v}, ${v})`
}

const categories = {
  audio: {
    title: 'Spectral Analysis',
    desc: 'Visualizing hidden frequency data in audio.',
    icon: '🔊'
  },
  image: { title: 'Bit Manipulation', desc: 'Advanced multi-pass LSB extraction.', icon: '🖼️' },
  text: { title: 'Zero-Width Decoder', desc: 'Uncovering invisible hidden messages.', icon: '📄' }
}

// --- Audio & Spectrogram Logic ---
const initAudio = () => {
  if (audioCtx) return
  audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  analyser = audioCtx.createAnalyser()
  analyser.fftSize = 1024
  source = audioCtx.createMediaElementSource(audioPlayer.value)
  source.connect(analyser)
  analyser.connect(audioCtx.destination)
}

const handleAudioUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    initAudio()
    audioPlayer.value.src = URL.createObjectURL(file)
    isAudioLoaded.value = true
    // Reset canvas on new upload
    const ctx = canvasRef.value.getContext('2d')
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  }
}

const draw = () => {
  if (!analyser || audioPlayer.value.paused) {
    cancelAnimationFrame(animationId)
    return
  }

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d', { alpha: false })
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  const render = () => {
    // Stop the loop if paused
    if (audioPlayer.value.paused || audioPlayer.value.ended) {
      cancelAnimationFrame(animationId)
      return
    }

    animationId = requestAnimationFrame(render)
    analyser.getByteFrequencyData(dataArray)

    // Shift pixels left
    const imageData = ctx.getImageData(1, 0, canvas.width - 1, canvas.height)
    ctx.putImageData(imageData, 0, 0)

    // Draw new column
    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i]
      const y = canvas.height - i * (canvas.height / bufferLength)
      ctx.fillStyle = heatmaps[currentHeatmap.value](value)
      ctx.fillRect(canvas.width - 1, y, 1, 1)
    }
  }
  render()
}

const takeScreenshot = () => {
  const canvas = canvasRef.value
  const link = document.createElement('a')
  link.download = `stego-capture-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

// --- Image LSB Logic ---
const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => decodeImage(e.target.result)
  reader.readAsDataURL(file)
}

const decodeImage = (src) => {
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data

    let binary = ''
    for (let i = 0; i < data.length; i++) {
      if ((i + 1) % 4 === 0) continue
      binary += data[i] & 1
    }

    const processBinary = (binStr) => {
      let text = ''
      for (let i = 0; i < binStr.length; i += 8) {
        const charCode = parseInt(binStr.substr(i, 8), 2)
        if (charCode === 0) break
        if (charCode >= 32 && charCode <= 126) text += String.fromCharCode(charCode)
      }
      return text
    }

    const normal = processBinary(binary)
    let reversedBinary = ''
    for (let i = 0; i < binary.length; i += 8) {
      reversedBinary += binary.substr(i, 8).split('').reverse().join('')
    }
    const reversed = processBinary(reversedBinary)

    decodedText.value =
      (normal.length > reversed.length ? normal : reversed) || 'No valid data found.'
  }
  img.src = src
}

const decodeZeroWidth = () => {
  const zwMap = { '‌': '0', '‍': '1' }
  const binary = zwText.value
    .split('')
    .map((c) => zwMap[c])
    .filter((c) => c !== undefined)
    .join('')
  let text = ''
  for (let i = 0; i < binary.length; i += 8) {
    const chunk = binary.substr(i, 8)
    if (chunk.length === 8) text += String.fromCharCode(parseInt(chunk, 2))
  }
  zwDecoded.value = text || 'No hidden zero-width characters detected.'
}

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
})
</script>

<template>
  <div class="stego-card">
    <div class="tool-header">
      <div class="category-info">
        <span class="category-icon">{{ categories[activeTab].icon }}</span>
        <div>
          <h2 class="category-title">{{ categories[activeTab].title }}</h2>
          <p class="category-desc">{{ categories[activeTab].desc }}</p>
        </div>
      </div>
      <div class="tab-group">
        <button
          v-for="(val, key) in categories"
          :key="key"
          :class="{ active: activeTab === key }"
          @click="activeTab = key"
        >
          {{ key.toUpperCase() }}
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'audio'" class="panel">
      <div class="audio-controls-box">
        <div class="upload-section">
          <input type="file" @change="handleAudioUpload" accept="audio/*" id="audio-file" hidden />
          <label for="audio-file" class="btn-primary">📁 CHOOSE AUDIO FILE</label>
        </div>

        <div class="player-section" v-show="isAudioLoaded">
          <audio ref="audioPlayer" controls @play="draw" class="custom-player"></audio>
        </div>

        <div class="viz-settings">
          <div class="setting-item">
            <span class="label">Heatmap:</span>
            <div class="heatmap-selector">
              <button
                v-for="(fn, name) in heatmaps"
                :key="name"
                @click="currentHeatmap = name"
                :class="['heat-btn', name, { selected: currentHeatmap === name }]"
              ></button>
            </div>
          </div>
          <button @click="takeScreenshot" class="btn-secondary">📸 TAKE SNAPSHOT</button>
        </div>
      </div>

      <div class="canvas-container">
        <div class="axis-labels"><span>20kHz</span><span>0Hz</span></div>
        <canvas ref="canvasRef" width="800" height="350"></canvas>
      </div>
    </div>

    <div v-if="activeTab === 'image'" class="panel">
      <label class="btn-primary"
        >🖼️ SELECT IMAGE TO SCAN
        <input type="file" @change="handleImageUpload" accept="image/*" hidden
      /></label>
      <div class="output-box">
        <label>DECODED MESSAGE</label>
        <textarea
          readonly
          v-model="decodedText"
          placeholder="Hidden content will appear here..."
        ></textarea>
      </div>
    </div>

    <div v-if="activeTab === 'text'" class="panel">
      <textarea
        v-model="zwText"
        @input="decodeZeroWidth"
        placeholder="Paste text here to scan for invisible secrets..."
      ></textarea>
      <div class="output-box">
        <label>DECODED MESSAGE</label>
        <textarea readonly v-model="zwDecoded"></textarea>
      </div>
    </div>

    <div class="tool-footer">
      Built with love by
      <a href="https://x.com/feezybellz_ii" target="_blank">"That Chill Guy"</a> to save
      <strong>GBOY</strong>
    </div>
  </div>
</template>

<style scoped>
.stego-card {
  background: var(--vp-c-bg-soft);
  border-radius: 28px;
  padding: 25px;
  border: 1px solid var(--vp-c-divider);
  margin-top: 2rem;
}
.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
}
.category-info {
  display: flex;
  align-items: center;
  gap: 15px;
  text-align: left;
}
.category-icon {
  font-size: 1.8rem;
  background: var(--vp-c-bg-mute);
  padding: 10px;
  border-radius: 15px;
}
.category-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--vp-c-text-1);
}
.category-desc {
  margin: 0;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}

.tab-group {
  display: flex;
  gap: 4px;
  background: var(--vp-c-bg-mute);
  padding: 4px;
  border-radius: 12px;
}
.tab-group button {
  padding: 6px 14px;
  font-size: 10px;
  font-weight: 800;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  color: var(--vp-c-text-2);
}
.tab-group button.active {
  background: var(--vp-c-brand-1);
  color: #000;
}

/* Audio Controls UI */
.audio-controls-box {
  background: var(--vp-c-bg-mute);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid var(--vp-c-divider);
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.upload-section {
  text-align: center;
}
.player-section {
  width: 100%;
}
.custom-player {
  width: 100%;
  height: 40px;
  border-radius: 100px;
}

.viz-settings {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  border-top: 1px solid var(--vp-c-divider);
  pt: 15px;
  padding-top: 15px;
}
.setting-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.setting-item .label {
  font-size: 10px;
  font-weight: 800;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
}

.heatmap-selector {
  display: flex;
  gap: 8px;
}
.heat-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.2s;
}
.heat-btn.cyber {
  background: #3b82f6;
}
.heat-btn.classic {
  background: #22c55e;
}
.heat-btn.magma {
  background: #ef4444;
}
.heat-btn.ghost {
  background: #fff;
}
.heat-btn.selected {
  border-color: var(--vp-c-brand-1);
  transform: scale(1.2);
}

.btn-primary {
  background: var(--vp-c-brand-1);
  color: #000;
  padding: 12px 24px;
  border-radius: 100px;
  font-weight: 800;
  font-size: 11px;
  cursor: pointer;
  border: none;
  display: inline-block;
  transition: opacity 0.2s;
}
.btn-secondary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 800;
  font-size: 10px;
  cursor: pointer;
  border: 1px solid var(--vp-c-divider);
}
.btn-primary:hover,
.btn-secondary:hover {
  opacity: 0.8;
}

.output-box {
  margin-top: 20px;
  text-align: left;
}
.output-box label {
  font-size: 9px;
  font-weight: 900;
  color: var(--vp-c-brand-1);
  letter-spacing: 1px;
}
textarea {
  width: 100%;
  height: 100px;
  background: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-divider);
  border-radius: 15px;
  font-family: monospace;
  font-size: 13px;
  padding: 12px;
  margin-top: 8px;
  color: var(--vp-c-text-1);
  resize: none;
}

.canvas-container {
  background: #000;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  border: 2px solid #1a1a1a;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}
.axis-labels {
  position: absolute;
  left: 10px;
  top: 10px;
  bottom: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 8px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 800;
  pointer-events: none;
  z-index: 10;
}
canvas {
  width: 100%;
  display: block;
  image-rendering: pixelated;
}

.tool-footer {
  margin-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 1.5rem;
  font-size: 0.8rem;
  text-align: center;
}
.tool-footer a {
  color: var(--vp-c-brand-1);
  font-weight: 700;
  text-decoration: none;
}
</style>
