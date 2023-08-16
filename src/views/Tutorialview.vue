<script setup lang="ts">
import { ref, Ref } from "vue"
import Page1 from "../components/TutorialPages/TutorialPage1.vue"
import Page2 from "../components/TutorialPages/TutorialPage2.vue"
import Page3 from "../components/TutorialPages/TutorialPage3.vue"
import Page4 from "../components/TutorialPages/TutorialPage4.vue"
import Page5 from "../components/TutorialPages/TutorialPage5.vue"
import Page6 from "../components/TutorialPages/TutorialPage6.vue"
import Page7 from "../components/TutorialPages/TutorialPage7.vue"
import Page8 from "../components/TutorialPages/TutorialPage8.vue"


const page = ref(1)
function handleNextPage() {
    page.value += 1
}
function handlePrevPage() {
    page.value -= 1
}
</script>
<template>
    <div class="container" >
        <Page1 v-if="page===1"></Page1> 
        <Page2 v-if="page===2"></Page2>
        <Page3 v-if="page===3"></Page3>
        <Page4 v-if="page===4"></Page4>
        <Page5 v-if="page===5"></Page5>
        <Page6 v-if="page===6"></Page6>
        <Page7 v-if="page===7"></Page7>
        <Page8 v-if="page===8"></Page8>
    </div>
    <div v-if="page!==1" class="toggle-page left" @click="handlePrevPage">
            <!-- <button class="btn zoom"> &#8592; </button> -->
            <div class="btn zoom"> &#8592; </div>
    </div>
    <div v-if="page!==1" class="toggle-page" style="left:800px">
        <span>{{page-1}}</span>
    </div>
    <div v-if="page!==8" class="toggle-page right" @click="handleNextPage">
            <!-- <button class="btn zoom"> &#8594; </button> -->
            <div class="btn zoom"> &#8594; </div>
    </div>


</template>

<style scoped>
  .toggle-page{
    /* display: flex;
    flex: 1; */
    position: absolute;
    bottom: 10px;
  }
  .right{
    right: 25px;
  }
  .left{
    left: 25px;
  }

  .btn {
    cursor: pointer;
    /* text-align: center; */
    font-size: 40px;
    border: 0;
    /* border-radius: 50%;
    width: 50px;
    height: 50px;
    border: 0;
    background-color: rgb(0, 0, 0,0.1); */
  }

  /* .btn:hover{
    background-color:rgba(0,0,0,0.4);
  } */
</style>