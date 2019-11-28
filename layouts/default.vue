<template>
  <div class="wrap">
    <div class="container">
      <div class="content">
        <head-content/>
        <list-content :portfolios="portfolios"/>
        <nuxt/>
        <footer>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
    import {mapActions} from 'vuex'
    import Header from '~/components/header/index'
    import List from '~/components/list/index'

    export default {
        components: {
            'head-content': Header,
            'list-content': List
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
    margin-left: auto;
    margin-right: auto;
    width: 100%;
    height: 100%;

    .container {
      position: relative;
      width: 100%;
      z-index: 0;
      text-align: left;
      padding-top: 50px;

      .content {
        position: relative;
        width: 1180px;
        left: 50%;
        margin-left: -590px;
        text-align: center;

        @media screen and (max-width: $break-small) {
          width: 100%;
          left: 0;
          margin-left: 0;
        }
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

        > .container {
          padding: 0 !important;

          > .content {
            width: 100% !important;
            left: 0 !important;
            margin: 0 !important;

            > .head-content {
              display: none;
            }

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
                box-shadow: unset !important;
                overflow: unset !important;

                > .nav {
                  display: none;
                }

                > .content {
                  width: auto !important;
                  left: 0 !important;
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

