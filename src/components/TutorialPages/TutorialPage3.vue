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
            :initial="{ x: -150,y:70}"
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
            :initial="{ x: 700,y:0}"
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
    x:(window.innerHeight)*0.7,
    y:(window.innerHeight)*0.2,
    transition: {
        type: 'spring',
        damping: 10,
        stiffness: 20,
        mass: 2
    }
    }
    const final_CNN = {
    x:(window.innerHeight)*0.67,
    y:(window.innerHeight)*0.1,
    transition: {
        type: 'spring',
        damping: 10,
        stiffness: 20,
        mass: 2
    }
    }
    const final_FOX = {
    x:(window.innerHeight)*0.1,
    y:-(window.innerHeight)*0.06,
    transition: {
        type: 'spring',
        damping: 10,
        stiffness: 20,
        mass: 2
    }
    }
    const final_B = {
    x:(window.innerHeight)*0.1,
    y:-(window.innerHeight)*0.08,
    transition: {
        type: 'spring',
        damping: 10,
        stiffness: 20,
        mass: 2
    }
    }
    const final_WP = {
    x:(window.innerHeight)*0.15,
    y:(window.innerHeight)*0.01,
    transition: {
        type: 'spring',
        damping: 10,
        stiffness: 20,
        mass: 2
    }
    }
    const final_ABC = {
    x:-(window.innerHeight)*0.1,
    y:(window.innerHeight)*0.25,
    transition: {
        type: 'spring',
        damping: 10,
        stiffness: 20,
        mass: 2
    }
    }
</script>

<style scoped>
@import "./tutorial.css";
.newsimg{
    width: 13%;
}

/* .center{
    width: 60%;
    margin: auto;
    display: block;
    width: 100%;
    max-width: 1400px;
} */

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