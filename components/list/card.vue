<template>
  <div class="card">
    <nuxt-link :to="`/article/${encodeURIComponent(portfolio.title.replace(/ /gi, '―'))}`">
      <transition name="list">
        <div v-show="show" class="container" :title="portfolio.title">
          <img class="is_main_image" src="/static/img/tab.png" alt="추천" title="바쁘시면 이거라도.." v-if="portfolio.isMain" />
          <div class="hiddenWrapper">
            <img class="preview_image" :src="`https://jerrypark.me/media/${portfolio.cover}`" :alt="portfolio.title"
                 @load="loadImg">
            <div class="card_body">
              <p class="title">{{ portfolio.title }}</p>
              <p class="date">{{ portfolio.date }}</p>
              <div class="category">
                <p class="title">{{ portfolio.category.title }}</p>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </nuxt-link>
  </div>
</template>

<script>
    export default {
        name: "card",
        props: ['portfolio'],
        data() {
            return {
                show: false
            }
        },
        methods: {
            loadImg(e) {
                this.show = true
            }
        }
    }
</script>

<style lang="scss" scoped>
  .card {
    position: relative;
    width: 255px;
    padding: 0 15px 40px;
    display: inline-block;

    .container {
      position: relative;
      width: 255px;
      height: 380px;
      background-color: #FFF;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 10px;
      box-shadow: 0 0 40px 0 rgba(0, 0, 0, 0.03);
      cursor: pointer;
      transform: scale(1, 1);

      &:hover {
        box-shadow: 0 0 40px 0 rgba(0, 0, 0, 0.1);
        transform: scale(1.04, 1.04);
        transition: all 0.1s;

        .preview_image {
          transform: scale(1.05, 1.05);
        }
      }

      .hiddenWrapper {
        overflow: hidden;
      }

      .is_main_image {
        position: absolute;
        right: 10px;
        top: -23px;
        z-index: 1;
      }

      .preview_image {
        position: relative;
        width: 100%;
        height: 220px;
        z-index: 0;
      }

      .card_body {
        position: absolute;
        top: 220px;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 20px;
        background-color: #FFF;
        box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.09);
        text-align: left;
        z-index: 1;

        > .title {
          height: 50px;
          font-weight: bold;
          color: #4d4e51;
          line-height: 1.5rem;
          word-break: break-all;
          display: block;
          display: -webkit-box;
          overflow: hidden;
          text-overflow: ellipsis;
          /* autoprefixer: off */
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .date {
          font-size: 14px;
          color: #4d4e51;
          padding: 10px 0;
          border-bottom: 1px solid #eaeaea;
        }

        .category {

          .title {
            font-size: 14px;
            color: #4d4e51;
            padding: 10px 0;
          }
        }
      }
    }

    .list-enter-active {
      transition: all 0.2s;
    }

    .list-enter {
      opacity: 0;
      transform: translateY(10px);
    }

  }
</style>
