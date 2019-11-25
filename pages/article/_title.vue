<template>
  <main class="article">
    <transition name="slide-fade" v-on:after-leave="afterLeave">
      <div v-show="show" class="container">
        <p class="btn_back" @click="goBack"><i class="material-icons">arrow_back</i> 뒤로</p>
        <div class="content" v-if="portfolio">
          <div class="header">
            <p class="title">{{ portfolio.title }}</p>
            <div class="info">
              <a class="category" @click="clickCategory">{{ portfolio.category.title }}</a>
              <p class="date">{{ portfolio.date }}</p>
            </div>
          </div>
          <div class="images">
            <div class="images_bg"></div>
            <div class="images_content">
              <a v-for="(_img, idx) in portfolio.PortfolioImages.filter(ele => !ele.isHidden)" :key="idx"
              target="_blank" :href="`https://jerrypark.me/media/${_img.src}`">
                <img :src="`https://jerrypark.me/media/${_img.src}`" :alt="`${portfolio.title}_${idx}`" />
              </a>
            </div>
          </div>
          <div class="body" v-html="contents"></div>
        </div>
        <div class="content loading" v-else>
          <div class="header">
            <p class="title"></p>
            <div class="info">
              <a class="category"></a>
              <p class="date"></p>
            </div>
          </div>
          <div class="images">
            <div class="images_bg"></div>
          </div>
          <div class="body">
            <p style="width: 200px"></p>
            <p style="width: 400px"></p>
            <p style="width: 300px"></p>
            <p style="width: 100px"></p>
          </div>
        </div>
      </div>
    </transition>
  </main>
</template>

<script>
  import Vue from 'vue'
  import {mapActions} from 'vuex'
  import axios from 'axios'

  export default {
    head () {
      return this.portfolio ? {
        title: `[${this.portfolio.category.title}] ${this.portfolio.title} | JERRYPARK.ME`,
        meta: [
          {
            title: `[${this.portfolio.category.title}] ${this.portfolio.title}`,
            keywords: `[${this.portfolio.category.title}] ${this.portfolio.title}`.split(' ').join(', '),
            author: 'JerryPark, eaeao, 박동혁',
            description: this.strip(this.contents).slice(0, 160),
            content: this.strip(this.contents).slice(0, 160),
            'og:image': this.portfolio.PortfolioImages ? `https://jerrypark.me/media/${this.portfolio.PortfolioImages[0].src}` : 'https://dev.jerrypark.me/static/img/jerrypark_cap.png',
            'og:type': 'website',
            'og:site_name': `JERRYPARK.ME`,
            'og:title': `[${this.portfolio.category.title}] ${this.portfolio.title}`,
            'og:description': this.strip(this.contents).slice(0, 160),
            'og:url': `https://jerrypark.me${this.$route.path}`,
          }
        ]
      } : {}
    },
    data() {
      return {
        show: false,
        portfolio: null
      }
    },
    async asyncData({params, from, error}) {
      let title = decodeURIComponent(params.title).replace(/―/gi, ' ');
      let portfolio = null;
      if (!from) {
        let {data} = await axios.post(Vue.prototype.$apiUrl, {
          query: `{
  portfolio(title: "${title}") {
    title con safe date category { title }
    PortfolioImages {
      src isHidden
    }
  }
}`
        });
        if (data.data.portfolio) {
          portfolio = data.data.portfolio;
        } else {
          error({ statusCode: 404, message: 'Article not found' })
        }
      }
      return {show: !from, portfolio}
    },
    computed: {
      category() {
        return this.$store.state.category;
      },
      contents() {
        return this.portfolio ? this.$markdown.toHTML(this.portfolio.con) : ""
      }
    },
    methods: {
      goBack() {
        this.show = false;
      },
      afterLeave() {
        this.$router.replace(this.category === 'ALL' ? '/' : `/${this.category.toLowerCase()}/`);
      },
      clickCategory() {
        this.show = false;
        this.setCategory(this.portfolio.category.title);
      },
      async getPortfolio() {
        let title = decodeURIComponent(this.$route.params.title).replace(/―/gi, ' ');
        let {data} = await axios.post(this.$apiUrl, {
          query: `{
  portfolio(title: "${title}") {
    title con safe date category { title }
    PortfolioImages {
      src isHidden
    }
  }
}`
        });
        if (data.data.portfolio) {
          this.portfolio = data.data.portfolio;
        }
      },
      clickA(self) {
        if (!self.target) {
          this.$router.push(self.dataset.href);
        } else {
          window.open(self.dataset.href, self.target);
        }
      },
      strip(con) {
        return `${con}`.replace(/<[^>]*>?/gm, '').replace(/\r?\n/gm, ' ');
      },
      ...mapActions({
        setCategory: 'setCategory'
      })
    },
    mounted() {
      window.click_a = this.clickA;
      if (!this.portfolio) {
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

        .body {
          line-height: 1.7;

          h1 {
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
  $break-small: 1000px;

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

      .btn_back {
        position: absolute;
        top: 20px;
        left: 20px;
        display: flex;
        align-items: center;
        font-size: 22px;
        color: #999;
        z-index: 1;
        cursor: pointer;

        &:hover {
          border-bottom: 1px solid #333;
          color: #333;
        }

        i {
          font-size: 28px;
          margin-right: 5px;
        }
      }

      .content {
        position: relative;
        width: 768px;
        left: 50%;
        margin-left: -434px;
        padding: 150px 30px 50px 30px;
        text-align: left;
        color: #333;
        z-index: 0;

        @media screen and (max-width: $break-small) {
          width: auto;
          left: 0;
          margin-left: 0;
        }

        .header {
          padding-bottom: 30px;

          .title {
            font-size: 35px;
            font-weight: bold;
            margin-bottom: 10px;
          }

          .info {
            display: inline-flex;
            color: #666;

            .category {
              margin-right: 20px;
              font-weight: bold;
            }
          }
        }

        .images {
          position: relative;
          width: 100%;
          min-height: 250px;
          margin-bottom: 30px;
          padding: 20px 0 0 0;

          .images_bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 3000px;
            height: 100%;
            margin-left: -1500px;
            background-color: #f5f5f5;
          }

          .images_content {
            position: relative;
            width: 100%;
            height: 100%;
            display: inline-table;

            img {
              max-width: 362px;
              max-height: 250px;
              margin-right: 20px;
              margin-bottom: 20px;
              border: 1px solid #e6e6e6;
              float: left;

              @media screen and (max-width: $break-small) {
                max-width: 100%;
              }
            }
          }
        }

        &.loading {

          .header {

            .title {
              width: 300px;
              height: 42px;
              background-color: #f0f0f0;
            }

            .info {

              .category {
                width: 80px;
                height: 19px;
                background-color: #f0f0f0;
              }

              .date {
                width: 100px;
                height: 19px;
                background-color: #f0f0f0;
              }
            }
          }

          .body {

            p {
              height: 21px;
              background-color: #f0f0f0;
              margin-bottom: 5px;
            }
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
