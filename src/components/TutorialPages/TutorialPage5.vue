<template>
    <img class="bg" src='/TutorialIMG/bg.jpg'/>
    <div style="margin-top: 1rem;">
        <br> 
        <div class="imagebox">
            <div style="width:90%">
                <img src="/TutorialIMG/EntitiesLink.png" class="center_img" style="width:90%;">
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
    <div class="textbox" > 
        <span class="textword">
            Entites may have many forms, for example, <span style="font-style: italic">Donald Trump</span>, <span style="font-style: italic">Trump</span> and <span style="font-style: italic">President Trump</span>, they are associated with a single topic,  <span style="font-weight: 600;font-style: italic">Donald Trump</span>. We link entities mentioned in different articles by Wikipedia ID and generate as a single topic. We visually encode each topic as a dot.
        </span>
    </div>
</template>



<style scoped>
@import "./tutorial.css";

</style>