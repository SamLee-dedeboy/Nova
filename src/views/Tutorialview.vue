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
const blocked = ref(true)

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
  .then(res => blocked.value=false)
})
</script>
<template>
  <div v-if="!blocked">
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
  </div>
  <div v-else style="width: 100%; height: 100%; font-size: 3rem; display: flex; flex-direction: column; align-items: center; justify-content: center">
    <div class="header" style="flex-basis: 5%;">
      Why are you seeing this page?
    </div>
    <div style="font-size: 1.5rem;"> The browser is blocking you for security reasons. Follow the instructions to disable it: </div>
    <div style="display: flex; width: 100%; flex: 1;">
      <div class="firefox" style="width: 100%; text-align: center; margin-right: 5px;"> 
        <span> Firefox </span>
        <div style="display: flex; flex-direction: column; align-items: left;"> 
          <div style="display: flex; align-items: top; padding: 5px; justify-content: center; border-bottom: dashed 1px black;">
            <img src="/security/1.svg" style="width: 30px; height: 30px; margin-top: 5px;"> 
            <img src="/security/firefox_1.png" style="width: 50%; margin-left: 30px;"/>
          </div>
          <div style="display: flex; align-items: top; padding: 5px; justify-content: center; border-bottom: dashed 1px black;">
            <img src="/security/2.svg" style="width: 30px; height: 30px; margin-top: 5px;"> 
            <img src="/security/firefox_2.png" style="width: 50%; margin-left: 30px;"/>
          </div>
          <div style="display: flex; align-items: top; padding: 5px; justify-content: center; border-bottom: dashed 1px black;">
            <img src="/security/done.svg" style="width: 30px; height: 30px; margin-top: 5px;"> 
            <img src="/security/firefox_done.png" style="width: 50%; margin-left: 30px;"/>
          </div>
        </div>
      </div>
      <div class="chrome" style="width: 100%; text-align: center; border-left: 1px solid black; padding-left: 5px;">
        <span> Chrome </span>
        <div style="display: flex; flex-direction: column; align-items: left; "> 
          <div style="display: flex; align-items: top; padding: 5px; justify-content: center; border-bottom: dashed 1px black;">
            <img src="/security/1.svg" style="width: 30px; height: 30px; margin-top: 5px;"> 
            <img src="/security/chrome_1.png" style="width: 40%; margin-left: 30px;"/>
          </div>
          <div style="display: flex; align-items: top; padding: 5px; justify-content: center; border-bottom: dashed 1px black;">
            <img src="/security/2.svg" style="width: 30px; height: 30px; margin-top: 5px;"> 
            <img src="/security/chrome_2.png" style="height: 50px; margin-left: 30px;"/>
          </div>
          <div style="display: flex; align-items: top; padding: 5px; justify-content: center; border-bottom: dashed 1px black;">
            <img src="/security/done.svg" style="width: 30px; height: 30px; margin-top: 5px;"> 
            <img src="/security/chrome_done.png" style="width: 50%; margin-left: 30px;"/>
          </div>
        </div>
      </div>
    </div>
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