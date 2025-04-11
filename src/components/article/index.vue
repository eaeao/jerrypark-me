<template>
  <div class="content" v-if="portfolio">
    <div class="header">
      <H1 class="title">{{ portfolio.title }}</H1>
      <div class="info">
        <a class="category" @click="clickCategory ? clickCategory : null">{{ portfolio.category && portfolio.category.title }}</a>
        <p class="date">{{ portfolio.date }}</p>
      </div>
    </div>
    <div class="images">
      <div class="images_bg"></div>
      <div class="images_content">
        <a v-for="(_img, idx) in portfolioImages" :key="idx" @click="clickImage ? clickImage(idx) : null">
          <img :src="`https://jerrypark.me/media/${_img.src}`" :alt="`${portfolio.title}_${idx}`" @load="_loadedImage(_img.src)"/>
        </a>
      </div>
    </div>
    <div class="body" v-html="contents"></div>
  </div>
  <div class="content loading" v-else>
    <div class="header">
      <H1 class="title"></H1>
      <div class="info">
        <a class="category"></a>
        <p class="date"></p>
      </div>
    </div>
    <div class="images">
      <div class="images_bg"></div>
    </div>
    <div class="body">
      <p style="width: 200px"></p>
      <p style="width: 400px"></p>
      <p style="width: 300px"></p>
      <p style="width: 100px"></p>
    </div>
  </div>
</template>

<script>
  export default {
      props: ['portfolio', 'clickImage', 'clickCategory', 'loadedImage'],
      computed: {
          contents() {
              return this.portfolio ? this.$markdown.toHTML(this.portfolio.con) : ""
          },
          portfolioImages() {
              return this.portfolio ? this.portfolio.PortfolioImages.filter(ele => !ele.isHidden) : []
          }
      },
      methods: {
          _loadedImage(url) {
              if(this.loadedImage) this.loadedImage(url)
          }
      }
  }
</script>

<style lang="scss" scoped>
  $break-small: 1200px;

  .content {
    position: relative;
    width: 768px;
    left: 50%;
    margin-left: -434px;
    padding: 150px 30px 50px 30px;
    text-align: left;
    color: #333;
    z-index: 0;

    @media screen and (max-width: $break-small) {
      width: auto;
      left: 0;
      margin-left: 0;
    }

    .header {
      padding-bottom: 30px;

      .title {
        font-size: 35px;
        font-weight: bold;
        margin-bottom: 10px;
      }

      .info {
        display: inline-flex;
        color: #666;

        .category {
          margin-right: 20px;
          font-weight: bold;
        }
      }
    }

    .images {
      position: relative;
      width: 100%;
      min-height: 250px;
      margin-bottom: 30px;
      padding: 20px 0 0 0;

      .images_bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 3000px;
        height: 100%;
        margin-left: -1500px;
        background-color: #f5f5f5;
      }

      .images_content {
        position: relative;
        width: 100%;
        height: 100%;
        display: inline-table;

        img {
          max-width: 362px;
          max-height: 234px;
          margin-right: 20px;
          margin-bottom: 20px;
          border: 1px solid #e6e6e6;
          float: left;

          @media screen and (max-width: $break-small) {
            max-width: 100%;
          }
        }
      }
    }

    &.loading {

      .header {

        .title {
          width: 300px;
          height: 42px;
          background-color: #f0f0f0;
        }

        .info {

          .category {
            width: 80px;
            height: 19px;
            background-color: #f0f0f0;
          }

          .date {
            width: 100px;
            height: 19px;
            background-color: #f0f0f0;
          }
        }
      }

      .body {

        p {
          height: 21px;
          background-color: #f0f0f0;
          margin-bottom: 5px;
        }
      }
    }
  }
</style>
