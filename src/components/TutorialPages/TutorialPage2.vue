<template>
    <img class="bg" src='../../../public/TutorialIMG/bg.jpg'/>
    <h1 style="margin-top: 1rem;">Welcome to NOVA! </h1>
    <div >
        <div class="textbox" >
            <span class="textword">
                NOVA, news outlet visual assessment, serves as a platform to allow general audiences to freely review mainstream media outlet coverage on a variety of topics. Additionally, our system supports user's in assessing if their prior expectations and understanding of an outlet aligns with how the iutlet reported on a selected topic.
            </span>
        </div>
        <div>
            <div class="textbox">
                <span class="textword">
                    The article you will browse soon were centered around COVID-19 and collected from U.S. mainstream media outlets (New York Times, CNN, Fox News, Breitbart, Washington Post and ABC News) from Feb 2020 to June 2020.
                </span>
            </div>
            <div class="imagebox">
                <div class = "column">
                    <img src="../../../public/TutorialIMG/New York Times.png" style="width:75%;margin-left:2.5rem"/>
                </div>
                <div class = "column">
                    <img src="../../../public/TutorialIMG/CNN.png" />
                </div>
                <div class = "column">
                    <img src="../../../public/TutorialIMG/FoxNews.png" />
                </div>
                <div class = "column">
                    <img src="../../../public/TutorialIMG/Breitbart.png" />
                </div>
                <div class = "column">
                    <img src="../../../public/TutorialIMG/Washington Post.png" />
                </div>
                <div class = "column">
                    <img src="../../../public/TutorialIMG/ABC News.png" />
                </div>
            </div>
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
  background-size: cover;
}

.textbox{
  background-color: #fff7ed;
  color: #000;
  width: 100%;
  max-width: 1400px;
  display: flex;
  margin: 30px auto;

}

.imagebox{
    display: flex;
    justify-content: center;
    align-items: center;
}
.textbox .textword{
  font-family: Georgia, serif;
  font-size:25px;
  background-color: #fff7ed;
  /* display: inline-block; */
  /* line-height: 2; */
  margin: 10px;
  padding: 20px;
  text-align: justify;
}

.column{
  float: left;
  width:16%;
  /* padding: 5px; */
}

h1{
 color: black;
 font-size: 50px;
 font-family: Georgia, serif;
 margin-left: 3rem;
}
</style>