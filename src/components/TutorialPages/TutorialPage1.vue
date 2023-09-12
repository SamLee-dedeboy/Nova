<template>
    <img class="bg" background-image src='/TutorialIMG/bg.jpg'/>
    <div style="margin-top: 1rem;"> 
        <div class="outbox ">
            <img src="/TutorialIMG/NOVA.png" class="image">
        </div>
        <div class="outbox">
            <span class="text">
                Click left arrow &#8592; or right arrow &#8594; below to start the introduction 
            </span>
        </div>
    </div>
</template>

<style scoped>
@import "./tutorial.css";

.image{

    width:80%;
    height: auto; 
    margin-right:auto;
    margin-left:auto;
    margin-top: 2%;
}
.text{
    font-style: italic;
    /* font-family: 'Lato'; */
    font-size: 1rem;
    padding:5px;
    width: 500px;
    text-align: center;

}
/* .text:hover{
    background: rgba(0,0,0,0.1);
    color:black;
    border-radius: 5px;
    cursor: pointer;
} */

</style>