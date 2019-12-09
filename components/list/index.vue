<template>
  <nav class="list-content">
    <card v-for="(portfolio, index) in portfolios" :key="index" :portfolio="portfolio"/>
    <div v-if="!portfolios">
      <loading />
    </div>
  </nav>
</template>

<script>
  import Card from '~/components/list/card'
  import Loading from '~/components/loading'

  export default {
    name: "list-content",
    props: ['portfolios'],
    components: {
      'card': Card,
      'loading': Loading,
    }
  }
</script>

<style lang="scss" scoped>
  .list-content {
    position: relative;
    padding: 40px 0 0;
    text-align: center;
  }
</style>
