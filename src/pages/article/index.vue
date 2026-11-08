<template>
  <div></div>
</template>

<script>
  export default {
    // /article 은 목록이 아니므로 서버에서부터 홈으로 영구 이동시킨다(예전에는 빈 페이지가 200으로 응답했다).
    middleware({redirect}) {
      redirect(301, '/')
    }
  }
</script>
