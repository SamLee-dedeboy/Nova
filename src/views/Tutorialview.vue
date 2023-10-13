<script setup lang="ts">
import { ref, Ref, VueElement } from "vue"
import { onMounted } from "vue"
import * as vue from "vue"
import Page1 from "../components/TutorialPages/TutorialPage1.vue"
import Page2 from "../components/TutorialPages/TutorialPage2.vue"
import Page3 from "../components/TutorialPages/TutorialPage3.vue"
import Page4 from "../components/TutorialPages/TutorialPage4.vue"
// import Page5 from "../components/TutorialPages/TutorialPage5.vue"
import Page6 from "../components/TutorialPages/TutorialPage6.vue"
import Page7 from "../components/TutorialPages/TutorialPage7.vue"
import Page8 from "../components/TutorialPages/TutorialPage8.vue"
import { useRoute, useRouter } from 'vue-router'
const router = useRouter()
const server_address = vue.inject("server_address")

const page = ref(1)
function handleNextPage() {
  if(page.value == 7) {
    router.push({ name: 'home' })
    return
  }
  page.value += 1
}
function handlePrevPage() {
  if(page.value == 1) return
  page.value -= 1
}
onMounted(() => {
  document.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowRight') {
        handleNextPage()
    } else if(e.key === 'ArrowLeft') {
        handlePrevPage()
    }
  })

  fetch(`${server_address}/overview/data`, {
    method: "POST",
    headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
    },
    body: JSON.stringify({article_num_threshold: 1000})
  })
  .then(res => res.json())
  .then(res => console.log(res))
})
</script>
<template>
    <div class="container" >
        <Page1 v-if="page===1"></Page1> 
        <Page2 v-if="page===2"></Page2>
        <Page3 v-if="page===3"></Page3>
        <Page4 v-if="page===4"></Page4>
        <Page6 v-if="page===5"></Page6>
        <Page7 v-if="page===6"></Page7>
        <Page8 v-if="page===7"></Page8>
        <!-- <Page4 v-if="page===4"></Page4>
        <Page5 v-if="page===5"></Page5>
        <Page6 v-if="page===6"></Page6>
        <Page7 v-if="page===7"></Page7>
        <Page8 v-if="page===8"></Page8> -->
    </div>
    <div v-if="page!==1" class="toggle-page left" @click="handlePrevPage">
            <!-- <button class="btn zoom"> &#8592; </button> -->
            <div class="btn zoom"> &#8592; </div>
    </div>
    <div v-if="page!==1" class="toggle-page" style="left:50%">
        <span>{{page-1}}</span>
    </div>
    <div v-if="page!==8" class="toggle-page right" @click="handleNextPage">
            <!-- <button class="btn zoom"> &#8594; </button> -->
            <div class="btn zoom"> &#8594; </div>
    </div>


</template>

<style scoped>
  .toggle-page{
    position: absolute;
    bottom: 0.4rem;
  }
  .right{
    right: 2rem;
  }
  .left{
    left: 2rem;
  }

  .btn {
    cursor: pointer;
    font-size: 5vh;
    border: 0;
  }

</style>