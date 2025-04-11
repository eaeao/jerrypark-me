<template>
  <div></div>
</template>

<script>
  import {mapActions} from 'vuex'

  export default {
    methods: {
      ...mapActions({
        setCategory: 'setCategory'
      })
    },
    mounted() {
      this.setCategory(this.$route.path.replace(/\//gi, '').toUpperCase())
    }
  }
</script>
