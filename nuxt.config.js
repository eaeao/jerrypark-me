module.exports = {
  telemetry: false,
  srcDir: 'src',
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
      if (isClient) {
        // axios(0.27+)의 toFormData가 Node 전용 분기에서 Buffer를 참조해서, webpack 4가 Buffer 폴리필을
        // 클라이언트 번들에 자동으로 넣는다(초기 JS가 min 22KB 늘어남). 브라우저에서는 Blob 분기만 타고
        // 이 사이트는 JSON만 보내므로 그 분기는 실행되지 않는다. 폴리필을 넣지 않는다.
        config.node = Object.assign({}, config.node, {Buffer: false})
      }
    }
  },
  modules: [
    'nuxt-material-design-icons'
  ],
  plugins: [
    {src: '~/plugins/markdown.js', ssr: true}
  ],
  router: {
    middleware: ['https']
  }
}

