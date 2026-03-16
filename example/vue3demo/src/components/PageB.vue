<template>
  <div class="page-b">
    <h1>Page B</h1>
    <button class="back-button" @click="handleBack">返回上一页</button>
  </div>
</template>

<script>
export default {
  name: 'PageB',
  methods: {
    handleBack() {
      this.$router.go(-1);
    }
  }
}
</script>

<style scoped>
.page-b {
  padding: 20px;
  text-align: center;
}

.back-button {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.back-button:hover {
  background-color: #35a372;
}

.back-button:active {
  background-color: #2d8f5f;
}
</style>

