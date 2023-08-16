<template>
    <img class="bg" background-image src='../../../TutorialIMG/bg.jpg'/>
    <div style="margin-top: 1rem;">
        <div class="outbox ">
            <img src="../../../TutorialIMG/NOVA.png" class="image">
        </div>
        <div class="outbox">
            <span class="text">
                Click left arrow &#8592; or right arrow &#8594; below to start the tutorial 
            </span>
        </div>
    </div>
</template>

<style>
body{
    margin: auto;
}
.bg{
  opacity:0.06;
  position:absolute;
  left:0;
  top:0;
  width:100%;
  height:auto;
}
.outbox{
    display: flex;
    justify-content: center;
    align-items: center;
}
.image{

    width:80%;
    height: auto; 
    margin-right:auto;
    margin-left:auto;
    margin-top: 2%;
}
.text{
    /* top: 3rem; */
    /* display: block; */
    font-style: italic;
    font-size: 1rem;
    /* margin: 0.5rem; */
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