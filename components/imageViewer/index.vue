<template>
  <div class="image_viewer">
    <transition name="slide-fade">
      <div v-show="selectedImageIndex > -1" class="container">
        <no-ssr>
          <component
            v-if="carousel"
            :is="carousel"
            :perPage="1"
            :navigationEnabled="true"
            :navigateTo="[selectedImageIndex, false]"
            :paginationActiveColor="'#72af2a'"
            @page-change="pageChange"
            @transition-end="transitionEnd"
          >
            <component :is="slide" v-for="(image, index) in images" :key="index">
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
            pageChange(index) {
                this.index = index
            },
            transitionEnd() {
                this.$router.replace({query: {image: this.index}})
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

      .VueCarousel {
        width: 100%;
        height: 90%;
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

    @media screen and (max-width: $break-small) {
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
