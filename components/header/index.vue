<template>
  <header class="head-content">
    <router-link to="/" exact><img class="jerrypark_cap" src="/static/img/jerrypark_cap.png" alt="JERRYPARK.ME"></router-link>
    <ul class="menu">
      <li>
        <a :class="{'active': category === 'ALL'}" @click="clickCategory('/')">ALL</a>
      </li>
      <li v-for="_category in categories" :key="_category.index">
        <a :class="{'active': category === _category.title}"
           @click="clickCategory(`/${_category.title.toLowerCase()}/`)">{{ _category.title }}</a>
      </li>
    </ul>
  </header>
</template>

<script>
  import {mapActions} from 'vuex'

  export default {
    name: "head-content",
    computed: {
      categories() {
        return this.$store.state.categories
      },
      category() {
        return this.$store.state.category;
      }
    },
    methods: {
      clickCategory(_url) {
        this.$router.push({path: _url})
      },
      ...mapActions({
        getCategories: 'getCategories',
      })
    },
    mounted() {
      // this.getCategories()
    }
  }
</script>

<style lang="scss" scoped>
  .head-content {
    height: 34px;
    padding: 0 15px 20px 15px;
    border-bottom: 1px solid #d9dee7;
    text-align: left;

    .jerrypark_cap {
      position: relative;
      top: -20px;

      &:hover {
        filter: brightness(150%);
        filter: contrast(80%);
      }
    }

    .menu {
      display: table;
      float: right;
      line-height: 35px;

      li {
        display: table-cell;
        padding: 0 3px;

        a {
          background-color: #797e8a;
          color: #FFF;
          padding: 5px 10px;
          border-radius: 5px;
          text-decoration: none;
          cursor: pointer;

          &.active, &:hover {
            background-color: #5755da;
          }
        }
      }
    }
  }
</style>
