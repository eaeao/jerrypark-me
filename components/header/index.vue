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
      <li class="print"><a title="인쇄" @click="goArticles"><i class="material-icons">print</i></a></li>
    </ul>
  </header>
</template>

<script>

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
            goArticles() {
                this.$router.push({path: '/articles/'})
            }
        }
    }
</script>

<style lang="scss" scoped>
  $break-small: 1200px;

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
            background-color: #72af2a;
          }
        }

        &.print {
          position: relative;
          width: 50px;
          padding: 0;

          a {
            position: absolute;
            width: 50px;
            background-color: transparent;
            color: #797e8a;
            line-height: normal;
            cursor: pointer;
            top: -5px;
            text-align: center;

            &.active, &:hover {
              color: #72af2a;
            }

            i {
              font-size: 30px;
            }
          }
        }
      }
    }

    @media screen and (max-width: $break-small) {
      height: auto;
      text-align: center;

      .jerrypark_cap {
        top: 0;
        margin-bottom: 20px;
      }

      .menu {
        display: block;
        float: none;
        text-align: center;

        li {
          display: inline-block;

          &.print {
            display: none;
          }
        }
      }
    }
  }
</style>
