<template>
  <div class="article">
    <transition name="slide-fade" v-on:after-leave="afterLeave">
      <div v-show="show" class="container">
        <div class="nav">
          <p class="btn_back" @click="goBack" title="뒤로"><i class="material-icons">arrow_back</i> 뒤로</p>
          <p class="btn_print" v-if="!loadedAllImages" title="인쇄"><loading /></p>
          <p class="btn_print" v-else @click="print" title="인쇄"><i class="material-icons">print</i></p>
        </div>
        <article-component
          v-if="!portfolios"
          :portfolio="null"
        />
        <article-component
          v-else
          v-for="(portfolio, index) in portfolios"
          :key="index"
          :portfolio="portfolio"
          :loadedImage="loadedImage"
          :eagerImages="true"
        />
      </div>
    </transition>
  </div>
</template>

<script>
    import {mapActions} from 'vuex'
    import {getPortfolios} from '~/store/api'
    import Article from '~/components/article/index'
    import Loading from '~/components/loading'
    import {SITE_NAME, SITE_AUTHOR, DEFAULT_OG_IMAGE, absoluteUrl} from '~/utils/site'

    // 인쇄본은 API의 마지막 항목(가장 오래된 프로필)을 맨 앞에 둔다.
    const moveLastToFront = (portfolios) => {
        if (!Array.isArray(portfolios) || portfolios.length === 0) {
            return []
        }
        return [portfolios[portfolios.length - 1], ...portfolios.slice(0, portfolios.length - 1)]
    }

    export default {
        head() {
            const description = 'Jerry Park(박동혁)의 포트폴리오 전체를 인쇄용으로 모은 페이지입니다.'
            return {
                title: `DongHyuk Park's Portfolio | ${SITE_NAME}`,
                meta: [
                    { hid: 'description', name: 'description', content: description },
                    // 모든 글을 그대로 복제한 인쇄용 페이지라 검색 결과에는 넣지 않는다.
                    { hid: 'robots', name: 'robots', content: 'noindex, follow' },
                    { hid: 'author', name: 'author', content: SITE_AUTHOR },
                    { hid: 'og:image', property: 'og:image', content: DEFAULT_OG_IMAGE },
                    { hid: 'og:type', property: 'og:type', content: 'website' },
                    { hid: 'og:site_name', property: 'og:site_name', content: SITE_NAME },
                    { hid: 'og:title', property: 'og:title', content: 'DongHyuk Park\'s Portfolio' },
                    { hid: 'og:description', property: 'og:description', content: description },
                    { hid: 'og:url', property: 'og:url', content: absoluteUrl('/articles/') }
                ]
            }
        },
        components: {
            'article-component': Article,
            'loading': Loading,
        },
        data() {
            return {
                show: false,
                portfolios: null,
                loadedImages: []
            }
        },
        asyncData({from, error}) {
            return getPortfolios().then(({ data }) => {
                const portfolios = data && data.data ? data.data.portfolios : null
                if (!portfolios) {
                    error({statusCode: 404, message: 'Article not found'})
                }
                // 페이지 이동 중에도 받아 온 목록을 그대로 쓴다(예전에는 버리고 mounted에서 같은 요청을 한 번 더 보냈다).
                return {show: !from, portfolios: portfolios ? moveLastToFront(portfolios) : null, loadedImages: []}
            }).catch(() => {
                // API 장애·시간 초과: Nuxt 기본 500 페이지 대신 error.vue를 503(일시적 오류)으로 보여 준다.
                error({statusCode: 503, message: 'Portfolios temporarily unavailable'})
                return {show: !from, portfolios: null, loadedImages: []}
            })
        },
        computed: {
            category() {
                return this.$store.state.category;
            },
            imageSourceCount() {
                // 같은 주소는 한 번만 센다(loadedImages도 주소 기준으로 중복 없이 쌓인다).
                const sources = {}
                const portfolios = this.portfolios || []
                portfolios.forEach(portfolio => {
                    (portfolio.PortfolioImages || [])
                        .filter(image => !image.isHidden)
                        .forEach(image => { sources[image.src] = true })
                })
                return Object.keys(sources).length
            },
            loadedAllImages() {
                if (!this.portfolios || this.portfolios.length === 0) {
                    return false
                }
                // 로드가 끝난(실패 포함) 이미지 수가 실제 이미지 주소 수에 닿으면 인쇄할 수 있다.
                return this.loadedImages.length >= this.imageSourceCount
            }
        },
        watch: {
            loadedAllImages(_bool) {
                if (_bool) {
                    setTimeout(() => { this.print(); }, 100)
                }
            }
        },
        methods: {
            goBack() {
                this.show = false;
            },
            print() {
                window.print()
            },
            afterLeave() {
                this.$router.replace(this.category === 'ALL' ? '/' : `/${this.category.toLowerCase()}/`);
            },
            getPortfolio() {
                getPortfolios().then(({ data }) => {
                    if (data && data.data && data.data.portfolios) {
                        this.portfolios = moveLastToFront(data.data.portfolios)
                    }
                })
            },
            loadedImage(url) {
                if (this.loadedImages.indexOf(url) === -1) {
                    this.loadedImages.push(url)
                }
            },
            ...mapActions({
                setCategory: 'setCategory'
            })
        },
        mounted() {
            if (!this.portfolios) {
                this.getPortfolio()
            }
            this.show = true;
        }
    }
</script>

<style lang="scss">
  .article {

    .container {

      .content {
        border-bottom: 1px dashed #e0e0e0;

        .body {
          line-height: 1.7;

          h2 {
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 5px;
          }

          p {
            margin-bottom: 20px;
          }

          ul {
            list-style: inherit;
            margin-left: 20px;
            margin-bottom: 20px;
          }
        }
      }
    }
  }
</style>

<style lang="scss" scoped>
  .article {

    .container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #FFF;
      box-shadow: 0 0 30px 0 rgb(255, 255, 255);
      overflow-x: hidden;
      overflow-y: auto;

      .nav {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        padding: 20px;
        z-index: 1;

        .btn_back {
          display: flex;
          align-items: center;
          font-size: 22px;
          color: #999;
          cursor: pointer;
          float: left;

          &:hover {
            border-bottom: 1px solid #333;
            color: #333;
          }

          i {
            font-size: 28px;
            margin-right: 5px;
          }
        }

        .btn_print {
          font-size: 22px;
          color: #999;
          cursor: pointer;
          float: right;

          &:hover {
            border-bottom: 1px solid #333;
            color: #333;
          }

          i {
            font-size: 28px;
          }
        }
      }
    }

    .slide-fade-enter-active {
      transition: all .4s ease;
    }

    .slide-fade-leave-active {
      transition: all .4s ease;
    }

    .slide-fade-enter, .slide-fade-leave-to {
      transform: translateY(100%);
    }
  }
</style>
