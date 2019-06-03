<template>
  <nav class="list-content">
    <card v-for="(portfolio, index) in portfolios" :key="index" :portfolio="portfolio"/>
    <div v-if="!portfolios">
      <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
           x="0px" y="0px" width="24px" height="30px" viewBox="0 0 24 30" style="enable-background:new 0 0 50 50;" xml:space="preserve">
<rect x="0" y="11.6379" width="4" height="7.72416" fill="#333">
<animate attributeName="height" attributeType="XML" values="5;21;5" begin="0s" dur="0.6s" repeatCount="indefinite"></animate>
<animate attributeName="y" attributeType="XML" values="13; 5; 13" begin="0s" dur="0.6s" repeatCount="indefinite"></animate>
</rect>
<rect x="10" y="7.63792" width="4" height="15.7242" fill="#333">
<animate attributeName="height" attributeType="XML" values="5;21;5" begin="0.15s" dur="0.6s" repeatCount="indefinite"></animate>
<animate attributeName="y" attributeType="XML" values="13; 5; 13" begin="0.15s" dur="0.6s" repeatCount="indefinite"></animate>
</rect>
<rect x="20" y="6.36208" width="4" height="18.2758" fill="#333">
<animate attributeName="height" attributeType="XML" values="5;21;5" begin="0.3s" dur="0.6s" repeatCount="indefinite"></animate>
<animate attributeName="y" attributeType="XML" values="13; 5; 13" begin="0.3s" dur="0.6s" repeatCount="indefinite"></animate>
</rect>
</svg>
    </div>
  </nav>
</template>

<script>
  import Card from '~/components/list/card'

  export default {
    name: "list-content",
    props: ['portfolios'],
    components: {
      'card': Card
    }
  }
</script>

<style lang="scss" scoped>
  .list-content {
    position: relative;
    padding: 40px 0 0;
    text-align: center;

    svg path, svg rect {
      fill: #949daa;
    }
  }
</style>
