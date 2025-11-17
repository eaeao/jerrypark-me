<template>
  <section class="home" itemscope itemtype="https://schema.org/CollectionPage">
    <header class="sr-only">
      <h1 itemprop="name">포트폴리오 전체 목록</h1>
      <p itemprop="description">
        Jerry Park의 최신 포트폴리오 카드 목록입니다. 각 카드는 상세 페이지로 이동하는 크롤링 가능한 링크를 제공합니다.
      </p>
    </header>
    <div class="seo-links">
      <ul class="seo-link-list">
        <li v-for="(portfolio, index) in portfolios" :key="`seo-link-${index}`">
          <nuxt-link
            v-if="portfolio"
            :to="`/article/${encodeURIComponent(portfolio.title.replace(/ /gi, '―'))}`"
            rel="bookmark"
            :title="`[${portfolio.category && portfolio.category.title ? portfolio.category.title : '카테고리 미정'}] ${portfolio.title}`"
            itemprop="hasPart"
            itemscope
            itemtype="https://schema.org/CreativeWork"
          >
            <span itemprop="name">{{ portfolio.title }}</span>
          </nuxt-link>
        </li>
      </ul>
    </div>
  </section>
</template>

<script>
  import {mapActions} from 'vuex'

  export default {
    computed: {
      portfolios() {
        return this.$store.state.portfolios || [];
      }
    },
    methods: {
      ...mapActions({
        setCategory: 'setCategory',
        getPortfolios: 'getPortfolios'
      })
    },
    mounted() {
      this.setCategory('ALL');
      if (!this.portfolios || this.portfolios.length === 0) {
        this.getPortfolios('ALL');
      }
    }
  }
</script>

<style lang="scss" scoped>
  .home {
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;

      h1 {
        font-size: 2rem;
        line-height: 1.2;
        margin: 0 0 8px;
        font-weight: 700;
      }

      p {
        margin: 0;
        font-size: 1rem;
        line-height: 1.5;
      }
    }

    .seo-links {
      text-align: center;
      margin-bottom: 20px;

      .seo-link-list {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          display: inline-block;
          margin: 0 10px 10px 0;

          a {
            color: #4d4e51;
            font-size: 14px;
            text-decoration: underline;

            &:hover,
            &:focus {
              color: #333;
            }
          }
        }
      }
    }
  }
</style>
