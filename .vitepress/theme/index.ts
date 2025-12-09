import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import Tweet from './components/Tweet.vue'
import HomeBanner from './components/HomeBanner.vue'
import GBoyBanner from './components/GBoyBanner.vue'
import ContributeForm from './components/ContributeForm.vue'
import CustomTweet from './components/CustomTweet.vue'
import MemeGallery from './components/MemeGallery.vue'
import MemeMasonry from './components/MemeMasonry.vue'
import BadgeCounter from './components/BadgeCounter.vue'
import './custom.css'

export default {
    ...DefaultTheme,
    Layout,
    enhanceApp({ app }: { app: any }) {
        // Global Components (used in Markdown)
        app.component('Tweet', Tweet)
        app.component('GBoyBanner', GBoyBanner)
        app.component('CustomTweet', CustomTweet)
        app.component('MemeGallery', MemeGallery)
        app.component('MemeMasonry', MemeMasonry)
        app.component('ContributeForm', ContributeForm)
        app.component('BadgeCounter', BadgeCounter)

        // Debugging: Global Error Handler
        app.config.errorHandler = (err: any, instance: any, info: any) => {
            console.error('Global Vue Error:', err, info)
            if (typeof window !== 'undefined') {
                const errorDiv = document.createElement('div')
                errorDiv.style.position = 'fixed'
                errorDiv.style.top = '0'
                errorDiv.style.left = '0'
                errorDiv.style.width = '100%'
                errorDiv.style.backgroundColor = 'red'
                errorDiv.style.color = 'white'
                errorDiv.style.padding = '20px'
                errorDiv.style.zIndex = '999999'
                errorDiv.style.whiteSpace = 'pre-wrap'
                errorDiv.innerText = `Vue Error: ${err.message}\n${err.stack}`
                document.body.appendChild(errorDiv)
            }
        }
    }
}
