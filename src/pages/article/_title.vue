<template>
  <div class="article" itemscope itemtype="https://schema.org/Article">
    <transition name="slide-fade" v-on:after-leave="afterLeave">
      <div v-show="show" class="container">
        <div class="nav">
          <p class="btn_back" @click="goBack" title="뒤로"><i class="material-icons">arrow_back</i> 뒤로</p>
          <p class="btn_print" v-if="portfolio" @click="print" title="인쇄"><i class="material-icons">print</i></p>
        </div>
        <article-component :portfolio="portfolio" :clickImage="clickImage" :clickCategory="clickCategory" />
      </div>
    </transition>
    <image-viewer :images="portfolioImages" :selectedImageIndex="selectedImageIndex"/>
  </div>
</template>

<script>
    import {mapActions} from 'vuex'
    import {getPortfolio} from '~/store/api'
    import Article from '~/components/article/index'
    import ImageViewer from '~/components/imageViewer/index'
    import {
        SITE_URL,
        SITE_NAME,
        SITE_AUTHOR,
        DEFAULT_OG_IMAGE,
        LD_JSON_HID,
        absoluteUrl,
        htmlToText,
        truncateText,
        ldJsonScript,
        titleFromRouteParam
    } from '~/utils/site'

    export default {
        head() {
            if (!this.portfolio) {
                return {}
            }
            const category = this.categoryTitle
            const heading = category ? `[${category}] ${this.portfolio.title}` : this.portfolio.title
            const description = this.metaDescription
            const image = this.primaryImage
            const url = this.canonicalUrl
            return {
                title: `${heading} | ${SITE_NAME}`,
                meta: [
                    { hid: 'description', name: 'description', content: description },
                    { hid: 'keywords', name: 'keywords', content: [category, this.portfolio.title].filter(Boolean).join(', ') },
                    { hid: 'author', name: 'author', content: SITE_AUTHOR },
                    { hid: 'og:image', property: 'og:image', content: image },
                    { hid: 'og:type', property: 'og:type', content: 'article' },
                    { hid: 'og:site_name', property: 'og:site_name', content: SITE_NAME },
                    { hid: 'og:title', property: 'og:title', content: heading },
                    { hid: 'og:description', property: 'og:description', content: description },
                    { hid: 'og:url', property: 'og:url', content: url }
                ],
                link: [
                    { hid: 'canonical', rel: 'canonical', href: url }
                ],
                script: [
                    ldJsonScript({
                        '@context': 'https://schema.org',
                        '@type': 'Article',
                        headline: this.portfolio.title,
                        description,
                        image,
                        author: {
                            '@type': 'Person',
                            name: 'DongHyuk Park'
                        },
                        datePublished: this.portfolio.date,
                        articleSection: category,
                        url,
                        publisher: {
                            '@type': 'Organization',
                            name: SITE_NAME,
                            logo: {
                                '@type': 'ImageObject',
                                url: DEFAULT_OG_IMAGE
                            }
                        }
                    })
                ],
                // JSON-LD는 ldJsonScript()가 직접 안전하게 만들므로 vue-meta의 HTML 이스케이프를 끈다.
                __dangerouslyDisableSanitizersByTagID: {
                    [LD_JSON_HID]: ['innerHTML']
                }
            }
        },
        components: {
            'article-component': Article,
            'image-viewer': ImageViewer
        },
        data() {
            return {
                show: false,
                portfolio: null,
                selectedImageIndex: -1,
                lastHash: '',
                hashChangeHandler: null
            }
        },
        asyncData({params, from, error}) {
            const title = titleFromRouteParam(params.title);
            return getPortfolio({ title }).then(({ data }) => {
                const portfolio = data && data.data ? data.data.portfolio : null;
                if (!portfolio) {
                    error({statusCode: 404, message: 'Article not found'})
                }
                // 페이지 이동 중에도 받아 온 글을 그대로 쓴다(예전에는 버리고 mounted에서 같은 요청을 한 번 더 보냈다).
                return {show: !from, portfolio}
            }).catch(() => {
                // API 장애·시간 초과: Nuxt 기본 500 페이지 대신 error.vue를 503(일시적 오류)으로 보여 준다.
                error({statusCode: 503, message: 'Article temporarily unavailable'})
                return {show: !from, portfolio: null}
            })
        },
        computed: {
            category() {
                return this.$store.state.category;
            },
            categoryTitle() {
                return this.portfolio && this.portfolio.category && this.portfolio.category.title
                    ? this.portfolio.category.title
                    : ''
            },
            contents() {
                return this.portfolio ? this.$markdown.toHTML(this.portfolio.con) : ""
            },
            portfolioImages() {
                return this.portfolio && Array.isArray(this.portfolio.PortfolioImages)
                    ? this.portfolio.PortfolioImages.filter(ele => !ele.isHidden)
                    : []
            },
            primaryImage() {
                const visible = this.portfolioImages[0]
                return visible ? encodeURI(`${SITE_URL}/media/${visible.src}`) : DEFAULT_OG_IMAGE
            },
            metaDescription() {
                return truncateText(htmlToText(this.contents), 160)
            },
            canonicalUrl() {
                if (!this.portfolio) {
                    return absoluteUrl(this.$route.path.replace(/\/+$/, ''))
                }
                // 요청 주소가 아니라 글 제목으로 만든다. 카드 링크(card.vue)와 같은 방식이라
                // /article/제목/, 공백을 %20으로 쓴 주소 같은 변형도 모두 sitemap의 주소 하나로 모인다.
                const path = `/article/${encodeURIComponent(this.portfolio.title.replace(/ /g, '―'))}`
                return absoluteUrl(this.$router.resolve(path).href)
            }
        },
        watch: {
            '$route'(_route) {
                this.openImageViewer()
            }
        },
        methods: {
            openImageViewer() {
                if (this.$route.query.image !== undefined && this.$route.query.image > -1) {
                    this.selectedImageIndex = this.$route.query.image
                } else {
                    this.selectedImageIndex = -1
                }
            },
            goBack() {
                this.show = false;
            },
            print() {
                window.print()
            },
            afterLeave() {
                this.$router.replace(this.category === 'ALL' ? '/' : `/${this.category.toLowerCase()}/`);
            },
            clickCategory() {
                if (!this.categoryTitle) {
                    return;
                }
                this.show = false;
                this.setCategory(this.categoryTitle);
            },
            getPortfolio() {
                const title = titleFromRouteParam(this.$route.params.title);
                getPortfolio({ title }).then(({ data }) => {
                    if (data && data.data && data.data.portfolio) {
                        this.portfolio = data.data.portfolio
                    }
                })
            },
            clickImage(index) {
                this.$router.push({query: {image: index}})
            },
            isSameRoutePath(targetPath) {
              const currentPath = targetPath || window.location.pathname;
              const normalizedCurrent = currentPath.endsWith('/') && currentPath !== '/' ? currentPath.slice(0, -1) : currentPath;
              const routePath = this.$route.path.endsWith('/') && this.$route.path !== '/' ? this.$route.path.slice(0, -1) : this.$route.path;
              return normalizedCurrent === routePath;
            },
            handlePopstate() {
              const currentHash = window.location.hash || '';
              if (currentHash !== this.lastHash) {
                  this.handleHashChange();
                  return;
              }
              if (this.isSameRoutePath()) {
                  this.goBack();
              }
            },
            scrollToTop() {
              if (!process.client) return;
              const container = this.$el ? this.$el.querySelector('.container') : document.querySelector('.article .container');
              if (container && container.scrollTo) {
                  container.scrollTo({top: 0, behavior: 'instant'});
              } else {
                  window.scrollTo({top: 0, behavior: 'instant'});
              }
            },
            handleHashChange() {
              const currentHash = window.location.hash || '';
              if (this.lastHash && !currentHash) {
                  window.requestAnimationFrame(() => {
                      this.scrollToTop();
                  });
              }
              this.lastHash = currentHash;
            },
            ...mapActions({
                setCategory: 'setCategory'
            })
        },
        mounted() {
            if (window) {
                this.lastHash = window.location.hash || '';
                // Prevent browser back button
                window.history.pushState(null, null, window.location.href);
                window.addEventListener('popstate', this.handlePopstate);
                this.hashChangeHandler = this.handleHashChange.bind(this);
                window.addEventListener('hashchange', this.hashChangeHandler);
            }
            if (!this.portfolio) {
                this.getPortfolio()
            }
            this.show = true;
            this.openImageViewer()
            this.handleHashChange()
        },
        beforeDestroy() {
            // Remove event listener when component is destroyed
            if (window) {
                window.removeEventListener('popstate', this.handlePopstate);
                if (this.hashChangeHandler) {
                    window.removeEventListener('hashchange', this.hashChangeHandler);
                }
            }
        }
    }
</script>

<style lang="scss">
  .article {

    .container {

      .content {

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
