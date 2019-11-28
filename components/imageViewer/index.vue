<template>
  <div class="image_viewer">
    <transition name="slide-fade">
      <div v-show="selectedImageIndex > -1" class="container">
        <div class="header">
          <p class="btn_back" @click="goBack"><i class="material-icons">close</i> 닫기</p>
        </div>
        <no-ssr>
          <component
            v-if="carousel"
            :is="carousel"
            :perPage="1"
            :navigationEnabled="true"
            :navigateTo="[selectedImageIndex, false]"
            :paginationActiveColor="'#72af2a'"
            :paginationPadding="5"
            @page-change="pageChange"
            @transition-end="transitionEnd"
          >
            <component
              :is="slide"
              v-for="(image, index) in images"
              :key="index"
              :data-src="`https://jerrypark.me/media/${image.src}`"
              @slide-click="slideClick"
            >
              <img class="image" :src="`https://jerrypark.me/media/${image.src}`"/>
            </component>
          </component>
        </no-ssr>
      </div>
    </transition>
  </div>
</template>

<script>
    export default {
        name: "image-viewer",
        props: ['images', 'selectedImageIndex'],
        data() {
            return {
                index: 0
            }
        },
        computed: {
            carousel() {
                return process.client ? require('vue-carousel').Carousel : null
            },
            slide() {
                return process.client ? require('vue-carousel').Slide : null
            }
        },
        methods: {
            goBack() {
                this.$router.replace({query: {}})
            },
            pageChange(index) {
                this.index = index
            },
            transitionEnd() {
                this.$router.replace({query: {image: this.index}})
            },
            slideClick(dataset) {
                window.open(dataset.src, '_blank')
            }
        },
        mounted() {
            this.index = this.selectedImageIndex
        }
    }
</script>

<style lang="scss">
  $break-small: 1200px;

  .image_viewer {

    .container {
      position: fixed;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      background-color: #000000a8;
      display: flex;
      justify-content: center;
      align-items: center;

      .header {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        padding: 20px;
        text-align: right;
        background: black;
        background: linear-gradient(180deg, rgb(0, 0, 0) 0%, rgb(0, 0, 0) 30%, rgba(0, 0, 0, 0) 100%);
        z-index: 1;

        .btn_back {
          font-size: 22px;
          color: #FFF;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;

          &:hover {
            border-bottom: 1px solid #FFF;
          }

          i {
            font-size: 28px;
            margin-right: 5px;
          }
        }
      }

      .VueCarousel {
        width: 100%;
        height: 90%;
        padding-top: 50px;
        align-items: center;
        justify-content: center;

        .VueCarousel-inner {
          width: 100%;
          height: 100% !important;

          .image {
            max-width: 90%;
            max-height: 100%;
          }
        }
      }
    }

    .slide-fade-enter-active {
      transition: all .4s ease;
    }

    .slide-fade-leave-active {
      transition: all .4s ease;
    }

    .slide-fade-enter, .slide-fade-leave-to {
      filter: alpha(opacity=0);
      opacity: 0;
    }
  }
</style>
