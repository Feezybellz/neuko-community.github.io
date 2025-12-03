# G*BOY SPECIAL Component Implementation

This guide provides HTML and Tailwind CSS code snippets to recreate specific components from [gboyspecial.com](https://gboyspecial.com).

## Prerequisites

Ensure your `tailwind.config.js` includes the following custom colors and fonts to match the site:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'gb-yellow': '#FFFF16',
        'gb-yellow-hover': '#EFEF06',
        'gb-blue': '#3C46FF',
        'gb-black': '#000000',
      },
      fontFamily: {
        mono: ['"Roboto Mono"', 'monospace'],
      },
    },
  },
}
```

---

## 1. Top Left Nav Island

This component is a minimal, pill-shaped or rectangular navigation container often found at the top left of the viewport. It uses a clean white background with black text.

### Preview
A small white container with "BADGES", "TELEGRAM", "CREATE" links.

### Code

```html
<!-- Nav Island Container -->
<div class="fixed top-4 left-4 z-50">
  <div class="flex items-center gap-4 bg-white px-4 py-2 rounded-md shadow-sm border border-gray-200">
    <!-- Logo / Icon (Optional) -->
    <div class="flex items-center justify-center w-6 h-6 bg-gb-yellow rounded text-xs font-bold">
      G*
    </div>

    <!-- Navigation Links -->
    <nav class="flex items-center gap-4">
      <a href="#" class="font-mono text-xs font-medium text-black hover:text-gb-blue transition-colors uppercase">
        Badges
      </a>
      <a href="#" class="font-mono text-xs font-medium text-black hover:text-gb-blue transition-colors uppercase">
        Telegram
      </a>
      <a href="#" class="font-mono text-xs font-medium text-black hover:text-gb-blue transition-colors uppercase">
        Create
      </a>
    </nav>
  </div>
</div>
```

**Key Features:**
- **Positioning**: `fixed top-4 left-4` keeps it accessible.
- **Styling**: `bg-white`, `rounded-md` (or `rounded-full` for a pill look), `shadow-sm`.
- **Typography**: `font-mono`, `text-xs`, `uppercase`.

---

## 2. Hero Section (Rounded Banner)

The hero section features a large, rounded container that houses a banner image or video. It has a distinct "bottom bar" containing the primary call-to-action and scrolling text or additional links.

### Preview
A large rounded rectangle. Top part is the visual media. Bottom strip is white with a yellow "GET BADGE" button.

### Code

```html
<!-- Hero Section Container -->
<div class="w-full max-w-6xl mx-auto p-4">
  
  <!-- Main Rounded Wrapper -->
  <div class="relative w-full rounded-xl overflow-hidden border border-gray-800 bg-gb-black">
    
    <!-- 1. Banner Media Area (Top) -->
    <!-- Aspect ratio can be adjusted. 'aspect-[3/1]' is a placeholder for the wide banner. -->
    <div class="relative w-full aspect-[3/1] bg-gray-900 group">
      <!-- Image Placeholder -->
      <img 
        src="https://placehold.co/1200x400/111/FFF?text=G*BOY+BANNER" 
        alt="Hero Banner" 
        class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
      />
      
      <!-- Overlay Content (Optional - e.g., Big Text) -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h1 class="font-mono text-6xl md:text-8xl font-bold text-white tracking-tighter">
          G*BOY
        </h1>
      </div>
    </div>

    <!-- 2. Bottom Action Bar -->
    <div class="w-full bg-white h-[52px] flex items-center justify-between px-4 md:px-6 py-2 border-t border-gray-200">
      
      <!-- Left: Ticker / Info -->
      <div class="flex items-center gap-3 overflow-hidden font-mono text-[10px] md:text-xs text-black uppercase">
        <span class="whitespace-nowrap">BUY ON:</span>
        <a href="https://magiceden.us/marketplace/gboy_badges_" target="_blank" class="hover:text-gb-blue hover:underline">MAGIC EDEN</a>
        <span class="text-gray-400">/</span>
        <a href="https://www.tensor.trade/trade/gboy_badges" target="_blank" class="hover:text-gb-blue hover:underline">TENSOR</a>
        
        <div class="hidden md:block w-px h-4 bg-gray-300 mx-1"></div>
        
        <a href="https://x.com/neukoai" target="_blank" class="hidden md:block whitespace-nowrap hover:text-gb-blue hover:underline">
          VIEW OFFICIAL X ACCOUNT @NEUKOAI
        </a>
      </div>

      <!-- Center: Primary CTA (Yellow Button) -->
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <button class="bg-gb-yellow hover:bg-gb-yellow-hover text-black font-mono font-bold text-xs px-6 py-2 rounded transition-colors shadow-[0_2px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]">
          GET BADGE
        </button>
      </div>

      <!-- Right: Secondary Link -->
      <div class="flex items-center">
        <a href="#" class="hidden md:flex items-center gap-2 bg-gb-blue hover:bg-gb-blue-hover text-white font-mono font-medium text-xs px-4 py-1.5 rounded transition-colors">
          <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          MEMBERS TELEGRAM
        </a>
        <!-- Mobile Icon for Right Side -->
        <a href="#" class="md:hidden text-black">
          →
        </a>
      </div>

    </div>
  </div>
</div>
```

**Key Features:**
- **Structure**: `rounded-xl`, `overflow-hidden`.
- **Bottom Bar**: Fixed height `h-[52px]`, `bg-white`, `flex` layout.
- **Center Button**: Absolute positioning `left-1/2 -translate-x-1/2` ensures it stays centered regardless of side content width.
- **Typography**: Consistent `font-mono` usage.

---
*Generated by Antigravity*
