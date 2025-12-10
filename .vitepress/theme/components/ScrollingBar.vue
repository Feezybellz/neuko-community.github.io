<script setup>
// Static component
</script>

<template>
  <div class="scrolling-bar-container">
    <div class="scrolling-bar">
      <div class="scrolling-wrapper">
        <!-- Duplicate content for seamless scrolling (4x to ensure no gaps) -->
        <div class="scrolling-content">
          <span>MAKE THINGS * PUT G*BOY ON THE INTERNET * DROWN THEM IN HIS IMAGE * MAKE THINGS * PUT G*BOY ON THE INTERNET * DROWN THEM IN HIS IMAGE *&nbsp;</span>
        </div>
        <div class="scrolling-content">
          <span>MAKE THINGS * PUT G*BOY ON THE INTERNET * DROWN THEM IN HIS IMAGE * MAKE THINGS * PUT G*BOY ON THE INTERNET * DROWN THEM IN HIS IMAGE *&nbsp;</span>
        </div>
        <div class="scrolling-content">
          <span>MAKE THINGS * PUT G*BOY ON THE INTERNET * DROWN THEM IN HIS IMAGE * MAKE THINGS * PUT G*BOY ON THE INTERNET * DROWN THEM IN HIS IMAGE *&nbsp;</span>
        </div>
        <div class="scrolling-content">
          <span>MAKE THINGS * PUT G*BOY ON THE INTERNET * DROWN THEM IN HIS IMAGE * MAKE THINGS * PUT G*BOY ON THE INTERNET * DROWN THEM IN HIS IMAGE *&nbsp;</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrolling-bar-container {
  width: auto;
  margin: 2rem 15px 0.5rem 15px; /* Float off sides/bottom, tighter to credits */
  padding: 0;
  position: relative;
}

.scrolling-bar {
  background-color: var(--vp-c-brand-1);
  color: black;
  font-family: var(--vp-font-family-mono);
  font-weight: bold;
  padding: 6px 0;
  text-transform: uppercase;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  border-radius: 10px; /* Fully rounded */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.scrolling-wrapper {
  display: flex;
  width: fit-content;
  animation: scroll 40s linear infinite; /* Slower animation for smoothness */
}

.scrolling-content {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

@keyframes scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-25%); /* Since we have 4 items, we scroll 1/4th (one item) before seamless reset */
  }
}

@media (max-width: 768px) {
  .scrolling-bar-container {
    padding: 0 0.5rem;
  }
  .scrolling-bar {
    padding: 6px 0;
    font-size: 10px;
  }
}
</style>
