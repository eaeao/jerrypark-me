<template>
  <div class="wrap">
    <div class="container">
      <head-content/>
      <main class="content" id="main" tabindex="-1">
        <list-content v-if="!hasError" :portfolios="portfolios"/>
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
            },
            hasError() {
                // 에러 페이지(error.vue)가 이전 카드 목록 아래에 묻혀 안 보이지 않도록, 에러 중에는 목록을 숨긴다.
                return !!(this.$nuxt && this.$nuxt.nuxt && this.$nuxt.nuxt.err)
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
      // layout.css의 height: 100% 때문에 body가 한 페이지 높이에 묶이면, 다음 페이지로 밀린 본문이 인쇄되지 않는다.
      height: auto !important;
      overflow: visible;
      background-color: #FFF;
      padding: 0 15mm;

      .wrap {
        width: auto !important;
        min-height: 0 !important;
        padding: 0 !important;

        > .container {
          // 화면용 flex 레이아웃은 인쇄 페이지 나눔을 브라우저마다 다르게 만들므로 일반 블록으로 바꾼다.
          display: block !important;
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

                // 전체 인쇄(/articles/)에서는 두 번째 글부터 새 페이지에서 시작한다.
                // 첫 글에도 강제 페이지 나눔을 걸면, 앞에 다른 요소(확장 프로그램이 넣은 요소 등)가 있을 때 첫 페이지가 빈다.
                > .content + .content {
                  page-break-before: always;
                  break-before: page;
                }

                > .content {
                  // 화면에서는 left: 50% + 음수 margin으로 가운데 정렬하므로, 인쇄할 때는 left도 함께 되돌린다.
                  // (margin만 0으로 바꾸면 본문이 페이지 가운데부터 시작해 오른쪽이 잘린다)
                  left: 0 !important;
                  width: auto !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  border: 0 !important;

                  > .images {

                    > .images_bg {
                      -webkit-print-color-adjust: exact;
                      print-color-adjust: exact;
                    }

                    > .images_content {

                      // 사진은 <button class="image_button"> 안에 있으므로 한 줄에 세 장이 되도록 버튼 너비를 제한한다.
                      // (img에 퍼센트를 주면 버튼 너비가 기준이 되어 사진이 아주 작게 찍힌다)
                      .image_button {
                        max-width: calc(33% - 20px) !important;
                      }

                      img {
                        max-width: 100% !important;
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

