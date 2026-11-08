<template>
  <section class="error-page" role="alert">
    <p class="status">{{ statusCode }}</p>
    <h1 class="title">{{ heading }}</h1>
    <p class="message">{{ description }}</p>
    <nuxt-link class="home" to="/">전체 포트폴리오 보기</nuxt-link>
  </section>
</template>

<script>
  import {SITE_NAME} from '~/utils/site'

  export default {
    props: {
      error: {
        type: Object,
        default: () => ({})
      }
    },
    computed: {
      statusCode() {
        return (this.error && this.error.statusCode) || 500
      },
      notFound() {
        return this.statusCode === 404
      },
      heading() {
        return this.notFound ? '페이지를 찾을 수 없어요' : '문제가 발생했어요'
      },
      description() {
        return this.notFound
          ? '주소가 바뀌었거나 삭제된 페이지입니다.'
          : '잠시 후 다시 시도해 주세요.'
      }
    },
    head() {
      return {
        title: `${this.heading} | ${SITE_NAME}`,
        meta: [
          { hid: 'robots', name: 'robots', content: 'noindex' }
        ]
      }
    }
  }
</script>

<style lang="scss" scoped>
  .error-page {
    padding: 60px 20px 80px;
    text-align: center;
    color: #4d4e51;

    .status {
      font-size: 48px;
      font-weight: 700;
      color: #949daa;
    }

    .title {
      margin-top: 10px;
      font-size: 22px;
      font-weight: 700;
    }

    .message {
      margin-top: 10px;
      font-size: 15px;
    }

    .home {
      display: inline-block;
      margin-top: 24px;
      padding: 8px 14px;
      border-radius: 5px;
      background-color: #0264b3;
      color: #FFF;
      text-decoration: none;

      &:hover,
      &:focus {
        background-color: #01518f;
        color: #FFF;
      }
    }
  }
</style>
