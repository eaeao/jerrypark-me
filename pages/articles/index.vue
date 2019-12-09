<template>
  <main class="article">
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
        />
      </div>
    </transition>
  </main>
</template>

<script>
    import {mapActions} from 'vuex'
    import {getPortfolios} from '~/store/api'
    import Article from '~/components/article/index'
    import Loading from '~/components/loading'

    export default {
        head() {
            return this.portfolios ? {
                title: `DongHyuk Park's Portfolio | JERRYPARK.ME`,
                meta: [
                    {
                        title: `DongHyuk Park's Portfolio`,
                        keywords: `DongHyuk Park's Portfolio`,
                        author: 'JerryPark, eaeao, 박동혁',
                        description: `DongHyuk Park's Portfolio | JERRYPARK.ME`,
                        content: `DongHyuk Park's Portfolio | JERRYPARK.ME`
                    },
                    { property: 'og:image', content: 'https://dev.jerrypark.me/static/img/jerrypark_cap.png' },
                    { property: 'og:type', content: 'website' },
                    { property: 'og:site_name', content: 'JERRYPARK.ME' },
                    { property: 'og:title', content: `DongHyuk Park's Portfolio`, },
                    { property: 'og:description', content: 'DongHyuk Park\'s Portfolio | JERRYPARK.ME', },
                    { property: 'og:url', content: `https://jerrypark.me${this.$route.path}` }
                ]
            } : {}
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
        asyncData({params, from, error}) {
            return getPortfolios().then(({ data }) => {
                let portfolios = null;
                if (!from) {
                    if (data.data.portfolios) {
                        portfolios = [data.data.portfolios[data.data.portfolios.length - 1], ...data.data.portfolios.slice(0, data.data.portfolios.length - 1)]
                    } else {
                        error({statusCode: 404, message: 'Article not found'})
                    }
                }
                return {show: !from, portfolios,loadedImages: []}
            })
        },
        computed: {
            category() {
                return this.$store.state.category;
            },
            loadedAllImages() {
                return this.portfolios
                    ? this.loadedImages.length === this.portfolios.map(ele => ele.PortfolioImages.filter(_ele => !_ele.isHidden).length).reduce((a, v) => a+v)
                    : false
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
                    if (data.data.portfolios) {
                        this.portfolios = [data.data.portfolios[data.data.portfolios.length - 1], ...data.data.portfolios.slice(0, data.data.portfolios.length - 1)]
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
            if (window) {
                window.click_a = this.clickA;
            }
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
