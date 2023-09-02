<template>
    <img class="bg" src='/TutorialIMG/bg.jpg'/>
    <h1 style="margin-top: 1rem;">How does <span style="font-style: italic">NOVA</span> work? </h1>
    <div >
        <img
            v-motion
            :initial="{ x: 200,y:500}"
            :enter="final_NY"
            class="absolute newsimg"
            src="/TutorialIMG/New_York_Times_articles.png"
        />
        <img
            v-motion
            :initial="{ x: 320,y:500}"
            :enter="final_CNN"
            class="absolute"
            style="width:16%"
            src="/TutorialIMG/CNN_articles.png"
        />
        <img
            v-motion
            :initial="{ x: -150,y:0}"
            :enter="final_FOX"
            class="absolute newsimg"
            src="/TutorialIMG/FoxNews_articles.png"
        />
        <img
            v-motion
            :initial="{ x: 50,y:-80}"
            :enter="final_B"
            class="absolute newsimg"
            src="/TutorialIMG/Breitbart_articles.png"
        />
        <img
            v-motion
            :initial="{ x: 500,y:10}"
            :enter="final_WP"
            class="absolute"
            style="width:12%"
            src="/TutorialIMG/Washington_Post_articles.png"
        />
        <img
            v-motion
            :initial="{ x: 100,y:500}"
            :enter="final_ABC"
            class="absolute newsimg"
            src="/TutorialIMG/ABC_News_articles.png"
        />  
    </div>
    <div class="textbox pop" style="margin-top: 12rem;">
        <span class="textword">
            <span style="font-style: italic">NOVA</span> offers a means to explore an individual's potential <span style="font-style:italic"> echo chamber </span> when it comes to online mainstream media outlets. Each news oulet has its own coverage and possible biases. Typically the average person receives their news from a subset of these outlets they trust. <span style="font-style: italic">NOVA</span> enables users to explore outside of their own universe and assess their assumptions of other outlets.
        </span>
    </div>
    <img class="pop circle absolute" src="/TutorialIMG/circle.png"/>
</template>

<script setup lang="ts">
    const final_NY = {
    x:500,
    y:150,
    transition: {
        type: 'spring',
        damping: 10,
        stiffness: 20,
        mass: 2
    }
    }
    const final_CNN = {
    x:500,
    y:80,
    transition: {
        type: 'spring',
        damping: 10,
        stiffness: 20,
        mass: 2
    }
    }
    const final_FOX = {
    x:70,
    y:-30,
    transition: {
        type: 'spring',
        damping: 10,
        stiffness: 20,
        mass: 2
    }
    }
    const final_B = {
    x:90,
    y:-60,
    transition: {
        type: 'spring',
        damping: 10,
        stiffness: 20,
        mass: 2
    }
    }
    const final_WP = {
    x:110,
    y:10,
    transition: {
        type: 'spring',
        damping: 10,
        stiffness: 20,
        mass: 2
    }
    }
    const final_ABC = {
    x:-150,
    y:200,
    transition: {
        type: 'spring',
        damping: 10,
        stiffness: 20,
        mass: 2
    }
    }
</script>

<style>
.newsimg{
    width: 13%;
}

.center{
    /* width: 60%; */
    margin: auto;
    display: block;
    width: 100%;
    max-width: 1400px;
}
.pop{
animation: clickit 1.9s
}
@keyframes clickit {
    0% {opacity: 0}
    80% {opacity: 0}
    100% {opacity: 1}
}
.circle{
    position: absolute;
    width: 30%;
    /* height: 100px; */
    right: 16rem;
    bottom: 16rem;
}
</style>













<!-- <template>
</template>

<script setup lang="ts">
import { ref, Ref } from 'vue'
const text_data: Ref<String> = ref("some data")
const text_data2: String = "some data"


</script>

<style>

</style> -->