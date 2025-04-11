<template>
  <div></div>
</template>

<script>
  import {mapActions} from 'vuex'

  export default {
    computed: {
      portfolios() {
        return this.$store.state.portfolios;
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
      if (!this.portfolios || (this.portfolios && this.portfolios.length === 0)) {
        this.getPortfolios('ALL');
      }
    }
  }
</script>
