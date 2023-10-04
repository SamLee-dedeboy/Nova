<template>
    <img class="bg" src='/TutorialIMG/bg.jpg'/>
    <div style="margin-top: 1rem;">
        <br> 
        <div class="imagebox" style="margin-top: 2rem;">
            <div style="width:80%">
                <img src="/TutorialIMG/articles_withTopics.png" class="center_img" style="width:100%;margin-left:2rem">
            </div>
            <div style="width:25%">
                <img src="/TutorialIMG/arrow.png" class="center_img" style="width:40%">
                <br>
            </div>
            <div style="width:80%">
                <img src="/TutorialIMG/Topics1.png" class="center_img" style="width:75%">
            </div>
            <div style="width:25%">
                <img src="/TutorialIMG/arrow.png" class="center_img" style="width:40%">
                <div class="box" style="margin:auto">
                    <span class="encode">
                            data encoding
                    </span>
                </div>
            </div>
            <div style="width:80%">
                <img src="/TutorialIMG/dots_5.png" class="center_img" style="width:70%;">
            </div>
        </div>
    </div> 
    <div class="textbox"> 
    <span class="textword">
        However, a dot doesn't reveal that much information. Not all topics received equal attention.
        <span>We count the total number of articles related to a topic and use a purple color scale encode each dot. A deepper purple implies more articles related to that topic. For example, there are 1557 articles related to <span style="font-weight: 600;font-style: italic">Donald Trump</span> and there are 87 articles for <span style="font-weight: 600;font-style: italic">The Times</span>. Therefore, the purple dot for <span style="font-weight: 600;font-style: italic">Donald Trump</span> is much darker than the dot for <span style="font-weight: 600;font-style: italic">The Times</span>.</span>
    </span>
    </div>
</template>


<style>
@import "./tutorial.css";
</style>