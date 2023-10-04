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
            In addition to encoding the attention a topic received, we also encode the sentiment of each topic when the outlet is reporting it.<span >
            We count both the number of negative and positive articles per topic. 
            <!-- Then we use min-max normalization on both counts and assign (<span class="pos_color">score<sub>pos</sub></span>, <span class="neg_color">score<sub>neg</sub></span>).  -->
            <!-- This value is used to determine the position of each dot.  -->
            We plot each topic using <span class="pos_color"> score<sub>pos</sub></span> as x-coordinate and <span class="neg_color"> score<sub>neg</sub> </span> as y-coordinate on the scatter plot.</span>
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