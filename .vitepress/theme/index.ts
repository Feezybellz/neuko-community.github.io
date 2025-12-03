import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import Tweet from './components/Tweet.vue'
import HomeBanner from './components/HomeBanner.vue'
import GBoyBanner from './components/GBoyBanner.vue'
import './custom.css'

export default {
    ...DefaultTheme,
    Layout,
    enhanceApp({ app }) {
        app.component('Tweet', Tweet)
        app.component('HomeBanner', HomeBanner)
        app.component('GBoyBanner', GBoyBanner)
    }
}
