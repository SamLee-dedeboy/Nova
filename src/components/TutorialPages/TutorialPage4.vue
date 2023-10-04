<template>
    <img class="bg" src='/TutorialIMG/bg.jpg'/>
    <div style="margin-top: 1rem;"> 
        <br>
        <!-- <div class="imagebox" >
            <div  style="width: 90%;">
                <img src="/TutorialIMG/articles.png" class="center_img" style="width: 90%;">
            </div>
            <div style="width: 25%;">
                <img src="/TutorialIMG/arrow.png" class="center_img" style="width: 40%;">
            </div>
            <div style="width: 90%;">
                <img v-motion src="/TutorialIMG/Entities.png" class="center_img" style="width: 90%;">
                <p style="text-align:center; font-size: 1rem; font-family: Georgia, serif;"> names of entities</p>
            </div>
        </div> -->
        <div class="imagebox">
            <div style="width:90%">
                <img src="/TutorialIMG/EntitiesLink.png" class="center_img" style="width:90%">
            </div>
            <div style="width:25%">
                <img src="/TutorialIMG/arrow.png" class = "center_img" style="width:35%" >
                <div class="box" style="width:45%;margin:auto">
                    <span class="encode">
                            data encoding
                    </span>
                </div>
            </div>
            <div style="width: 60%;">
                <img src="/TutorialIMG/dots_4.png" class="center_img" style="width: 70%;">
            </div>
        </div>
    </div>
    <div class="textbox">
        <span class="textword">
            We analyzed these articles and extracted entities. These entities are people or organizations that are familiar to user and serve as topics.
            We visually encode each topic as a dot.
        </span>
    </div>
</template>

<style scoped>
@import "./tutorial.css";

</style>