<template>
  <div class="wrap">
    <div class="container">
      <div class="content">
        <head-content/>
        <list-content :portfolios="portfolios"/>
        <nuxt />
        <footer>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
  import { mapActions } from 'vuex'
  import Header from '~/components/header/index'
  import List from '~/components/list/index'

  export default {
    components: {
      'head-content': Header,
      'list-content': List
    },
    computed: {
      portfolios() {
        return this.$store.state.portfolios;
      },
      category() {
        return this.$store.state.category;
      }
    },
    watch: {
      category: function (_category) {
        this.getPortfolios(_category);
      }
    },
    methods: {
      ...mapActions({
        getPortfolios: 'getPortfolios'
      })
    }
  }
</script>

<style lang="scss" scoped>
  $break-small: 1200px;

  .wrap {
    margin-left: auto;
    margin-right: auto;
    width: 100%;
    height: 100%;

    .container {
      position: relative;
      width: 100%;
      z-index: 0;
      text-align: left;
      padding-top: 50px;

      .content {
        position: relative;
        width: 1180px;
        left: 50%;
        margin-left: -590px;
        text-align: center;

        @media screen and (max-width: $break-small) {
          width: 100%;
          left: 0;
          margin-left: 0;
        }
      }
    }
  }
</style>

