<template>
  <section class="category-page">
    <h1 class="sr-only">{{ heading }}</h1>
  </section>
</template>

<script>
  import {mapActions} from 'vuex'
  import {SITE_NAME, listPageHead, resolveCategoryTitle, hasCategories, truncateText} from '~/utils/site'

  // ABOUT은 프로필·회사 소개라 '포트폴리오'·'프로젝트'라고 부르지 않는다.
  const ABOUT = 'ABOUT'

  export default {
    validate({params, store}) {
      if (!hasCategories(store.state.categories)) {
        // 카테고리 API 장애: 아무 주소나 200 페이지가 되지 않도록 503(일시적 오류)으로 응답한다.
        const error = new Error('Categories are temporarily unavailable')
        error.statusCode = 503
        throw error
      }
      // 없는 카테고리 주소는 빈 목록(200) 대신 404를 돌려준다.
      return resolveCategoryTitle(store.state.categories, params.category) !== null
    },
    head() {
      const title = this.categoryTitle
      if (!title) {
        return {}
      }
      const items = (this.$store.state.portfolios || [])
        .filter(portfolio => portfolio && portfolio.category && portfolio.category.title === title)
      const names = items.slice(0, 3).map(portfolio => portfolio.title).join(' · ')
      let description
      if (title === ABOUT) {
        description = `Jerry Park(박동혁) 소개 페이지입니다.${names ? ` ${names}` : ''}`
      } else {
        description = `Jerry Park(박동혁)의 ${title} 포트폴리오입니다.`
        if (items.length) {
          description += ` 프로젝트 ${items.length}건: ${names}${items.length > 3 ? ' 등' : ''}`
        }
      }
      return listPageHead({
        title: `${this.heading} | ${SITE_NAME}`,
        ogTitle: this.heading,
        description: truncateText(description, 160),
        path: `/${title.toLowerCase()}/`
      })
    },
    computed: {
      categoryTitle() {
        return resolveCategoryTitle(this.$store.state.categories, this.$route.params.category)
      },
      heading() {
        if (!this.categoryTitle) {
          return ''
        }
        return this.categoryTitle === ABOUT ? 'Jerry Park 소개' : `${this.categoryTitle} 포트폴리오`
      }
    },
    methods: {
      ...mapActions({
        setCategory: 'setCategory'
      })
    },
    mounted() {
      if (this.categoryTitle) {
        this.setCategory(this.categoryTitle)
      }
    }
  }
</script>

<style lang="scss" scoped>
  .category-page {
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
    }
  }
</style>
