<template>
  <header class="head-content">
    <router-link to="/" exact>
      <img class="flyers_logo" src="/static/img/flyers.png" alt="JERRYPARK.ME">
    </router-link>
    <ul class="menu">
      <li>
        <router-link
          exact
          to="/"
          :class="{'active': category === 'ALL'}"
          :aria-current="category === 'ALL' ? 'page' : null"
        >
          ALL
        </router-link>
      </li>
      <li v-for="_category in categories" :key="_category.index">
        <router-link
          exact
          :to="`/${_category.title.toLowerCase()}/`"
          :class="{'active': category === _category.title}"
          :aria-current="category === _category.title ? 'page' : null"
        >
          {{ _category.title }}
        </router-link>
      </li>
      <li class="print">
        <router-link
          exact
          to="/articles/"
          title="인쇄"
          aria-label="인쇄 페이지로 이동"
        >
          <i class="material-icons">print</i>
        </router-link>
      </li>
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
        }
    }
</script>

<style lang="scss" scoped>
  $break-small: 1200px;

  .head-content {
    min-height: 34px;
    padding: 0 15px 20px 15px;
    border-bottom: 1px solid #d9dee7;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;

    .flyers_logo {
      position: relative;
      width: 160px;
      top: -6px;

      &:hover {
        filter: brightness(1.1) contrast(.95);
      }
    }

    .menu {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      line-height: 1.3;
      margin: 0;
      padding: 0;
      list-style: none;

      li {
        display: flex;

        a {
          display: inline-flex;
          align-items: center;
          background-color: #797e8a;
          color: #FFF;
          padding: 5px 10px;
          border-radius: 5px;
          text-decoration: none;
          cursor: pointer;

          &.active, &:hover {
            background-color: #0264b3;
          }
        }

        &.print {
          a {
            background-color: transparent;
            color: #797e8a;
            line-height: normal;
            cursor: pointer;
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
      flex-direction: column;
      align-items: center;

      .flyers_logo {
        top: 0;
        margin-bottom: 20px;
      }

      .menu {
        justify-content: center;

        li.print {
          display: none;
        }
      }
    }
  }
</style>
