<template>
  <div
    class="content"
    v-if="portfolio"
    itemscope
    itemtype="https://schema.org/CreativeWork"
    itemprop="mainEntity"
  >
    <div class="header">
      <H1 class="title" itemprop="headline">{{ portfolio.title }}</H1>
      <div class="info">
        <button
          class="category"
          type="button"
          @click="clickCategory ? clickCategory : null"
          :aria-label="`${portfolio.category && portfolio.category.title} 카테고리 목록 보기`"
        >
          {{ portfolio.category && portfolio.category.title }}
        </button>
        <p class="date">
          <time :datetime="isoDate" itemprop="datePublished">{{ portfolio.date }}</time>
        </p>
      </div>
    </div>
    <div class="images" itemprop="image">
      <div class="images_bg"></div>
      <div class="images_content">
        <button
          v-for="(_img, idx) in portfolioImages"
          :key="idx"
          class="image_button"
          type="button"
          @click="clickImage ? clickImage(idx) : null"
          :aria-label="`${portfolio.title} 이미지 ${idx + 1} 크게 보기`"
        >
          <img
            :src="`https://jerrypark.me/media/${_img.src}`"
            :alt="`${portfolio.title} 이미지 ${idx + 1}`"
            loading="lazy"
            @load="_loadedImage(_img.src)"
          />
        </button>
      </div>
    </div>
    <div class="body" v-html="contents" itemprop="articleBody"></div>
  </div>
  <div class="content loading" v-else>
    <div class="header">
      <H1 class="title"></H1>
      <div class="info">
        <span class="category"></span>
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
      inheritAttrs: false,
      props: ['portfolio', 'clickImage', 'clickCategory', 'loadedImage'],
      computed: {
          contents() {
              if (!this.portfolio) {
                  return ""
              }
              return this.addAnchors(this.$markdown.toHTML(this.portfolio.con))
          },
          portfolioImages() {
              return this.portfolio ? this.portfolio.PortfolioImages.filter(ele => !ele.isHidden) : []
          },
          isoDate() {
              if (!this.portfolio || !this.portfolio.date) {
                  return ''
              }
              const date = new Date(this.portfolio.date)
              if (isNaN(date.getTime())) {
                  return this.portfolio.date
              }
              return date.toISOString().split('T')[0]
          }
      },
      methods: {
          _loadedImage(url) {
              if(this.loadedImage) this.loadedImage(url)
          },
          addAnchors(html) {
              if (!html) return ""
              const slugStore = {}
              const hasHeading = /<h2(\s|>)/i.test(html)
              if (hasHeading) {
                  return html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (match, attrs = '', inner) => {
                      const pureText = this.stripHtml(inner).trim()
                      if (!pureText) {
                          return match
                      }
                      let existingIdMatch = attrs.match(/\sid\s*=\s*["']([^"']+)["']/i)
                      let slug = existingIdMatch ? existingIdMatch[1] : this.slugify(pureText, slugStore)
                      if (existingIdMatch) {
                          slugStore[slug] = true
                      } else {
                          attrs = `${attrs} id="${slug}"`
                      }
                      const normalizedAttrs = attrs.trim().replace(/\s+/g, ' ')
                      const attrString = normalizedAttrs ? ` ${normalizedAttrs}` : ''
                      return `<h2${attrString}><a class="body-anchor" href="#${slug}" aria-label="${pureText} 섹션으로 이동">${inner}</a></h2>`
                  })
              }
              return html.replace(/<strong>([\s\S]*?)<\/strong>/gi, (match, text) => {
                  const pureText = this.stripHtml(text).trim()
                  if (!pureText) {
                      return match
                  }
                  const slug = this.slugify(pureText, slugStore)
                  return `<a id="${slug}" class="body-anchor" href="#${slug}" aria-label="${pureText} 섹션으로 이동"><strong>${text}</strong></a>`
              })
          },
          slugify(text, store) {
              const base = text
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .toLowerCase()
                  .replace(/[^a-z0-9가-힣]+/g, '-')
                  .replace(/^-+|-+$/g, '') || 'section'
              let slug = base
              let counter = 2
              while (store[slug]) {
                  slug = `${base}-${counter++}`
              }
              store[slug] = true
              return slug
          },
          stripHtml(value) {
              return `${value}`.replace(/<[^>]*>?/gm, '')
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
          background: transparent;
          border: none;
          color: #0264b3;
          cursor: pointer;
          padding: 0;
          font: inherit;
          text-decoration: underline;
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

        .image_button {
          max-width: 362px;
          max-height: 234px;
          margin-right: 20px;
          margin-bottom: 20px;
          border: 0;
          padding: 0;
          background: transparent;
          float: left;
          cursor: pointer;
          font: inherit;

          img {
            width: 100%;
            max-height: 234px;
            border: 1px solid #e6e6e6;
          }

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
<style lang="scss">
  .body-anchor {
    color: #333;
    cursor: default;
    text-decoration: none;
    position: relative;

    &:hover,
    &:focus {
      color: #333;
      text-decoration: none;
    }
  }
</style>
