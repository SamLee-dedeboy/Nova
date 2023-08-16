<template>
    <img class="bg" src='../../../TutorialIMG/bg.jpg'/>
    <div class="outbox" style="height: 750px;margin-top: 1rem;">
        <div>
            <h1 class="textbox">
                <span class="textword_8" style="font-size: 50px; ">
                Your journey with our system starts now! Click and Try out <span style="font-style: italic">NOVA</span> by youself ! &#8680;
                <img src="../../../TutorialIMG/nova_logo.png" class="novalogo zoom"  style="float:right"
                @click="handleNOVAlogoClicked"
                > 
                </span>
            </h1>
        </div>
    </div>
</template>
<script setup lang="ts">
    import { useRoute, useRouter } from 'vue-router'
    const router = useRouter()
    function handleNOVAlogoClicked() {
        router.push({ name: 'home' })
    }
</script>
<style>
.textbox .textword_8{
  font-family: Georgia, serif;
  background-color: #fff7ed;
  /* display: inline-block; */
  /* line-height: 2; */
  margin: 10px;
  padding: 20px;
  text-align: justify;
  width: 1050px;
}
.novalogo{
    width: 12%;
    margin-top: 0.5rem;
    margin-right: 1rem;
}
.novalogo:hover{
    cursor: pointer;
}
.zoom{
  transition: transform .2s;
}
.zoom:hover{
  transform: scale(1.3);
}
</style>