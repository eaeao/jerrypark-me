module.exports = {
  /*
  ** Headers of the page
  */
  head: {
    htmlAttrs: {
      lang: 'ko',
    },
    title: 'JERRYPARK.ME',
    meta: [
      {charset: 'utf-8'},
      {name: 'viewport', content: 'width=device-width, initial-scale=1'},
      {hid: 'description', name: 'description', content: 'JerryPark'}
    ],
    link: [
      {rel: 'icon', type: 'image/x-icon', href: '/favicon.ico'},
      {rel: 'stylesheet', href: '/static/css/layout.css'}
    ]
  },
  /*
  ** Customize the progress bar color
  */
  loading: {color: '#3B8070'},
  /*
  ** Build configuration
  */
  build: {
    /*
    ** Run ESLint on save
    */
    extend(config, {isDev, isClient}) {
      if (isDev && isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }
    }
  },
  modules: ['nuxt-material-design-icons'],
  plugins: [
    // ssr: false to only include it on client-side
    {src: '~plugins/global.js', ssr: true},
    {src: '~plugins/markdown.js', ssr: true},
    {src: '~plugins/ga.js', ssr: false},
    {src: '~plugins/hotjar.js', ssr: false}
  ]
}

