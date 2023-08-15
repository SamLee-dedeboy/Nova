<template>
    <img class="bg" src='../../../TutorialIMG/bg.jpg'/>
    <div style="margin-top: 1rem;"> 
        <br>
        <div class="imagebox" >
            <div  style="width: 90%;">
                <img src="../../../TutorialIMG/articles.png" class="center_img" style="width: 90%;">
            </div>
            <div style="width: 25%;">
                <img src="../../../TutorialIMG/arrow.png" class="center_img" style="width: 40%;">
            </div>
            <div style="width: 90%;">
                <img v-motion src="../../../TutorialIMG/Entities.png" class="center_img" style="width: 90%;">
                <p style="text-align:center; font-size: 1rem; font-family: Georgia, serif;"> names of entities</p>
            </div>
        </div>
    </div>
    <div class="textbox">
        <span class="textword">
            To support exploration, we analyzed these articles and extracted named entities. These entities are terms and concepts that are familiar to user and serve as topics.
        </span>
    </div>
</template>

<style>

  .center_img{
    /* padding: 1px; */
    display: block;
    margin-left: auto;
    margin-right: auto;
  }

</style>