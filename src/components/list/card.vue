<template>
  <article class="card" itemscope itemtype="https://schema.org/CreativeWork">
    <nuxt-link
      class="card_link"
      :to="articlePath"
      rel="bookmark"
      :title="linkTitle"
      :aria-label="linkTitle"
      itemprop="url"
    >
      <div class="container" :class="{'is-loaded': isImageLoaded}" :title="portfolio.title">
        <img
          v-if="portfolio.isMain"
          class="is_main_image"
          src="/static/img/tab.png"
          alt="추천 포트폴리오"
          title="추천 포트폴리오"
          itemprop="award"
        />
        <div class="hiddenWrapper">
          <img
            class="preview_image"
            :src="coverSrc"
            :alt="imageAlt"
            loading="lazy"
            width="255"
            height="220"
            @load="handleImgLoad"
            @error="handleImgError"
            itemprop="image"
          >
          <div class="card_body">
            <p class="title" itemprop="headline">{{ portfolio.title }}</p>
            <p class="date">
              <time :datetime="isoDate" itemprop="datePublished">{{ portfolio.date }}</time>
            </p>
            <div class="category">
              <p class="title" itemprop="about">{{ categoryTitle }}</p>
            </div>
          </div>
        </div>
      </div>
    </nuxt-link>
  </article>
</template>

<script>
    export default {
        name: "card",
        props: {
            portfolio: {
                type: Object,
                required: true
            }
        },
        data() {
            return {
                isImageLoaded: false,
                hasImageError: false
            }
        },
        computed: {
            articlePath() {
                return `/article/${encodeURIComponent(this.portfolio.title.replace(/ /gi, '―'))}`
            },
            linkTitle() {
                const category = this.categoryTitle ? `[${this.categoryTitle}] ` : ''
                return `${category}${this.portfolio.title} - 상세 보기`
            },
            categoryTitle() {
                return this.portfolio.category && this.portfolio.category.title ? this.portfolio.category.title : ''
            },
            imageAlt() {
                return `${this.portfolio.title} 대표 이미지`
            },
            coverSrc() {
                if (this.hasImageError || !this.portfolio.cover) {
                    return 'https://jerrypark.me/static/img/jerrypark_cap.png'
                }
                return `https://jerrypark.me/media/${this.portfolio.cover}`
            },
            isoDate() {
                const date = new Date(this.portfolio.date)
                return isNaN(date.getTime()) ? this.portfolio.date : date.toISOString().split('T')[0]
            }
        },
        methods: {
            handleImgLoad() {
                this.isImageLoaded = true
            },
            handleImgError() {
                this.hasImageError = true
                this.isImageLoaded = true
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

    .card_link {
      display: block;
      text-decoration: none;
    }

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
      transition: box-shadow 0.2s ease, transform 0.2s ease;

      &.is-loaded {
        box-shadow: 0 0 40px 0 rgba(0, 0, 0, 0.05);
      }

      &:hover {
        box-shadow: 0 0 40px 0 rgba(0, 0, 0, 0.1);
        transform: scale(1.04, 1.04);

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
        object-fit: cover;
        transition: transform 0.2s ease;
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
  }
</style>
