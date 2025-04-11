<template>
  <main class="article">
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
  </main>
</template>

<script>
    import {mapActions} from 'vuex'
    import {getPortfolio} from '~/store/api'
    import Article from '~/components/article/index'
    import ImageViewer from '~/components/imageViewer/index'

    export default {
        head() {
            return this.portfolio ? {
                title: `[${this.portfolio.category.title}] ${this.portfolio.title} | JERRYPARK.ME`,
                meta: [
                    {
                        title: `[${this.portfolio.category.title}] ${this.portfolio.title}`,
                        keywords: `[${this.portfolio.category.title}] ${this.portfolio.title}`.split(' ').join(', '),
                        author: 'JerryPark, eaeao, 박동혁',
                        description: this.strip(this.contents).slice(0, 160),
                        content: this.strip(this.contents).slice(0, 160)
                    },
                    { property: 'og:image', content: this.portfolio.PortfolioImages ? `https://jerrypark.me/media/${this.portfolio.PortfolioImages[0].src}` : 'https://dev.jerrypark.me/static/img/jerrypark_cap.png' },
                    { property: 'og:type', content: 'website' },
                    { property: 'og:site_name', content: 'JERRYPARK.ME' },
                    { property: 'og:title', content: `[${this.portfolio.category.title}] ${this.portfolio.title}`, },
                    { property: 'og:description', content: this.strip(this.contents).slice(0, 160), },
                    { property: 'og:url', content: `https://jerrypark.me${this.$route.path}` }
                ]
            } : {}
        },
        components: {
            'article-component': Article,
            'image-viewer': ImageViewer
        },
        data() {
            return {
                show: false,
                portfolio: null,
                selectedImageIndex: -1
            }
        },
        asyncData({params, from, error}) {
            let title = decodeURIComponent(params.title).replace(/―/gi, ' ');
            return getPortfolio({ title }).then(({ data }) => {
                let portfolio = null;
                if (!from) {
                    if (data.data.portfolio) {
                        portfolio = data.data.portfolio
                    } else {
                        error({statusCode: 404, message: 'Article not found'})
                    }
                }
                return {show: !from, portfolio}
            })
        },
        computed: {
            category() {
                return this.$store.state.category;
            },
            contents() {
                return this.portfolio ? this.$markdown.toHTML(this.portfolio.con) : ""
            },
            portfolioImages() {
                return this.portfolio ? this.portfolio.PortfolioImages.filter(ele => !ele.isHidden) : []
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
                this.show = false;
                this.setCategory(this.portfolio.category.title);
            },
            getPortfolio() {
                let title = decodeURIComponent(this.$route.params.title).replace(/―/gi, ' ');
                getPortfolio({ title }).then(({ data }) => {
                    if (data.data.portfolio) {
                        this.portfolio = data.data.portfolio
                    }
                })
            },
            clickA(self) {
                if (!self.target) {
                    this.$router.push(self.dataset.href);
                } else {
                    window.open(self.dataset.href, self.target);
                }
            },
            clickImage(index) {
                this.$router.push({query: {image: index}})
            },
            strip(con) {
                return `${con}`.replace(/<[^>]*>?/gm, '').replace(/\r?\n/gm, ' ');
            },
            handlePopstate() {
              window.history.pushState(null, null, window.location.href);
              this.goBack();
            },
            ...mapActions({
                setCategory: 'setCategory'
            })
        },
        mounted() {
            if (window) {
                window.click_a = this.clickA;
                // Prevent browser back button
                window.history.pushState(null, null, window.location.href);
                window.addEventListener('popstate', this.handlePopstate);
            }
            if (!this.portfolio) {
                this.getPortfolio()
            }
            this.show = true;
            this.openImageViewer()
        },
        beforeDestroy() {
            // Remove event listener when component is destroyed
            if (window) {
                window.removeEventListener('popstate', this.handlePopstate);
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
