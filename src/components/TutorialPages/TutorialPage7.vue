<template>
    <img class="bg" src='/TutorialIMG/bg.jpg'/>
    <div style="margin-top: 1rem;">
      <br> 
      <div class="imagebox" style="margin-top: 2rem;">
          <div style="width:80%">
              <img src="/TutorialIMG/articles_withSenti.png" class="center_img" style="width:100%;margin-left: 2rem;">
          </div>
          <div style="width:20%">
              <img src="/TutorialIMG/arrow.png" class="center_img" style="width:50%" >
              <br>
          </div>
          <div style="width:80%">
              <img src="/TutorialIMG/Topics3.png" class="center_img" style="width:90%">
          </div>
          <div style="width:20%">
              <img src="/TutorialIMG/arrow.png" class="center_img" style="width:50%" >
              <div class="box" style="margin:auto">
                  <span class="encode">
                          data encoding
                  </span>
              </div>
          </div>
          <div style="width:80%">
              <img src="/TutorialIMG/6.png" class="center_img" style="width:100%">
          </div>
      </div>
    </div>
    <div class="textbox"> 
        <span class="textword">
            In addition to encoding the interest a topic received from media outlets, we also encode the sentiment type of each topic derived from the content of related articles.<span >
            We count both the number of negative and positive articles per topic. Then we use min-max normalization on both counts and assign (<span class="pos_color">score<sub>pos</sub></span>, <span class="neg_color">score<sub>neg</sub></span>). This value is used to determine the position of each dot. We plot each topic using score<sub>pos</sub> as x-coordinate and score<sub>neg</sub> as y-coordinate on the 2-D scatter plot.</span>
        </span>
    </div>
</template>

<style scoped>
@import "./tutorial.css";
  .neg_color{
    background-color: #f4c49c;
    opacity:1.0;
  }
  .pos_color {
    background: #baf0f5;
  }
  .neu_color {
    background: #dddddd;
  }
  .mix_color{
    background-image: linear-gradient(-45deg, #f4c49c 25%, #baf0f5 25%, #baf0f5 50%, #f4c49c 50%, #f4c49c 75%, #baf0f5 75%, #baf0f5 100%);
    background-size: 20px 20px;
  }
</style>