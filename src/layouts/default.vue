<template>
  <div class="wrap">
    <div class="container">
      <head-content/>
      <main class="content" id="main" tabindex="-1">
        <list-content :portfolios="portfolios"/>
        <nuxt/>
      </main>
      <footer class="sr-only" aria-label="저작권 및 추가 정보">
      </footer>
    </div>
    <!-- 3D 종이비행기 오버레이 (클라이언트 전용) -->
    <client-only>
      <paper-airplane/>
    </client-only>
  </div>
</template>

<script>
    import {mapActions} from 'vuex'
    import Header from '~/components/header/index'
    import List from '~/components/list/index'
    import PaperAirplane from '~/components/paperAirplane/index'

    export default {
        components: {
            'head-content': Header,
            'list-content': List,
            'paper-airplane': PaperAirplane
        },
        computed: {
            portfolios() {
                return this.$store.state.portfolios;
            },
            category() {
                return this.$store.state.category;
            }
        },
        watch: {
            category: function (_category) {
                this.getPortfolios(_category);
            }
        },
        methods: {
            ...mapActions({
                getPortfolios: 'getPortfolios'
            })
        }
    }
</script>

<style lang="scss" scoped>
  $break-small: 1200px;

  .wrap {
    width: 100%;
    min-height: 100vh;
    padding: 0 20px;
    box-sizing: border-box;

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .container {
      max-width: 1180px;
      margin: 0 auto;
      padding-top: 50px;
      display: flex;
      flex-direction: column;
      text-align: left;

      .content {
        width: 100%;
        text-align: left;
      }

      footer {
        margin-top: auto;
      }
    }
  }
</style>

<style lang="scss">
  @media print {

    @page {
      size: auto;
      margin: 22mm 0;
    }

    h2, h3 {
      page-break-after: avoid;
    }

    img {
      max-width: 100% !important;
    }

    ul, img {
      page-break-inside: avoid;
    }

    html, body {
      width: auto;
      overflow: visible;
      background-color: #FFF;
      padding: 0 15mm;

      .wrap {
        width: auto !important;
        padding: 0 !important;

        > .container {
          padding: 0 !important;

          > .head-content {
            display: none;
          }

          > .content {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;

            > .list-content {
              display: none;
            }

            > .article {

              > .image_viewer {
                display: none;
              }

              > .container {
                position: relative !important;
                width: auto !important;
                height: auto !important;
                box-shadow: none !important;
                overflow: unset !important;

                > .nav {
                  display: none;
                }

                > .content {
                  width: auto !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  page-break-before: always;
                  border: 0 !important;

                  > .images {

                    > .images_bg {
                      -webkit-print-color-adjust: exact;
                      print-color-adjust: exact;
                    }

                    > .images_content {

                      img {
                        max-width: calc(33% - 20px) !important;
                      }
                    }
                  }

                  > .body {

                    a {
                      color: unset !important;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
</style>

