<script setup lang="ts">
import { Ref, ref, onMounted, computed } from "vue"
import { SentimentType, Sentiment2D } from "../types"
import * as SstColors from "./utils/ColorUtils"

const props = defineProps({
    data: Object as () => any,
    segmentation:  Object as () => Sentiment2D,
    outlets: Object as () => String[],
    show_animation: Boolean,
})

const showNextStep = ref(false)
const typeCompleted = ref(false)

onMounted(() => {
    // progressively update content
    const container: HTMLElement = document.querySelector(".entity-info-container")
    // if(props.show_animation) {
    if(false) {
        let i = 0;
        const stringResponse = container.innerHTML
        const intervalId = setInterval(() => {
            if(stringResponse[i] === "<") {
                // i++;
                while(stringResponse[i] !== ">") {
                    i++;
                }
            }
            // container.innerHTML = stringResponse.slice(0, i).replaceAll("$", "");
            container.innerHTML = stringResponse.slice(0, i)
            container.style.opacity = "1"
            i++;
            if (i > stringResponse.length) {
                typeCompleted.value = true
                clearInterval(intervalId);
            }
        }, 20);
        return () => clearInterval(intervalId);
    } else {
        container.style.opacity = "1"
        typeCompleted.value = true
    }
})

const emit = defineEmits(["outlet-clicked"])

const total_articles = computed(() => props.data.article_ids.length)
const pos_articles = computed(() => props.data.pos_article_ids.length)
const neg_articles = computed(() => props.data.neg_article_ids.length)
const pos_ratio = computed(() => Math.round(pos_articles.value / total_articles.value*100) + "%")
const neg_ratio = computed(() => Math.round(neg_articles.value / total_articles.value*100) + "%")
const entity_sst_category = computed(() => {
    const sst = {pos: props.data.pos_sst, neg: props.data.neg_sst}
    const segmentation = props.segmentation
    if (sst.pos === 0 && sst.neg === 0) return SentimentType.unknown
    if (sst.pos < segmentation.pos && sst.neg < segmentation.neg) return SentimentType.neu
    if (sst.pos < segmentation.pos && sst.neg > segmentation.neg) return SentimentType.neg
    if (sst.pos > segmentation.pos && sst.neg < segmentation.neg) return SentimentType.pos
    if (sst.pos > segmentation.pos && sst.neg > segmentation.neg) return SentimentType.mix
    return SentimentType.neu
})
const category_css_name = computed(() => {
    if(entity_sst_category.value === SentimentType.pos) return "pos_color"
    if(entity_sst_category.value === SentimentType.neg) return "neg_color"
    if(entity_sst_category.value === SentimentType.mix) return "mix_color"
    if(entity_sst_category.value === SentimentType.neu) return "neu_color"
})

function outletIconStyle(name: string) {
    let className = name
    className = (className.includes("FoxNews") || className.includes("Breitbart")) ? className : 'icon';
    return className;
}

function handleOutletClicked(outlet) {
    emit("outlet-clicked", outlet)
}

</script>
<template>
    <div class="entity-info-container" style="opacity:0">
        <p> A total of 
            <span style="text-decoration: underline; ">{{  total_articles }}</span>
            polarizing articles were found talking about 
            <span  :class="category_css_name" class="entity">{{props.data.name}}</span>
        </p>
        <p> <span class="pos_color">{{  `${pos_articles} (${pos_ratio})` }} </span> of them are <span class="pos_color">positive</span>,</p>
        <p> <span class="neg_color">{{  `${neg_articles} (${neg_ratio})` }} </span> of them are <span class="neg_color">negative</span>,</p>
        <p>
            This translates to a positively <span style="font-style:italic"> polarizing score </span> of <span class="pos_color">{{ props.data.pos_sst.toFixed(2) }}</span> and
            a negatively <span style="font-style:italic"> polarizing score </span> of <span class="neg_color">{{ props.data.neg_sst.toFixed(2) }}</span>.
            <i class='pi pi-question-circle tooltip'>
                <span class="tooltiptext right-tooltiptext" style="width: 200px;">
                    We calculate the polarizing scores by using min-max normalization on the number of articles.
                    <br>
                    A score of 1 means that the entity has the highest number of positive/negative articles.
                </span>
            </i>
        </p>
        <p>
            According to the current segmentation rule (
                <span class="pos_color"> {{ props.segmentation.pos.toFixed(2) }}</span>,
                <span class="neg_color"> {{ props.segmentation.neg.toFixed(2) }}</span>
            ),
        </p>
        <p>
            <span :class="category_css_name" class="entity"> {{ props.data.name }} </span> is categorized as <span :class="category_css_name">{{ entity_sst_category }}</span>.
        </p>
        <br> &nbsp;
        <p style="font-style: italic"> 
            Hint: If you think some topics should or should not be controversial, drag the white square 
            <svg width="10" height="10">
                <rect width=10 height=10 fill="white" stroke="black" stroke-width="1"></rect>
            </svg>
            in the scatterplot
            <svg width="20" height="20">
                <rect x=0 y=0 width=10 height=10 :fill="SstColors.neg_color" stroke="black" stroke-width="1"></rect>
                <rect x=10 y=0 width=10 height=10 :fill="SstColors.mixed_color" stroke="black" stroke-width="1"></rect>
                <rect x=0 y=10 width=10 height=10 :fill="SstColors.neu_color" stroke="black" stroke-width="1"></rect>
                <rect x=10 y=10 width=10 height=10 :fill="SstColors.pos_color" stroke="black" stroke-width="1"></rect>
            </svg>
            so that controversial topics appear in the <span class="mix_color"> mixed</span> region
        </p>
    </div>
    <Button v-if="typeCompleted" severity="secondary" text raised @click="showNextStep=true" style="width:fit-content;font-family:Trebuchet MS" > 
        <i class='pi pi-chevron-circle-down'></i>
        &nbsp;
        What's next? 
    </Button>
    <div v-if="showNextStep" class="next-step-container">
        <p> The statistics are calculated from articles published by the following outlets:
            <div class="journal-grid">
                <div class="journal-cell" v-for="outlet in outlets" @click="handleOutletClicked(outlet)">
                    <img :src="`imgs/${outlet}.png`"
                        :class="['journal-image',`${outletIconStyle(outlet)}`]" />
                    <div class="overlay"></div>
                </div>
            </div>

            <!-- <div :class="['journal-style', toggleSelection(selected_entity, view.title)]">
                <img :src="`/${view.title.split('-')[2]}.png`"
                    :class="['journal-image',`${outletIconStyle(view.title)}`]" />
            </div> -->
        </p>
        <p>
            <p>
                <br>
                Naturally, each outlet would report differently on the topic.
                <p style="font-weight: bold; font-size: 1.1rem;">
                    Why is <span :class="category_css_name" class="entity"> {{ props.data.name }} </span> categorized as 
                    {{ entity_sst_category }} overall?
                    <!-- <span :class="category_css_name">{{ entity_sst_category }}</span> overall ? -->
                </p>
                Some articles must have reported <span class="pos_color">positively</span>, while others <span class="neg_color">negatively</span>.
            </p>
            <br>
            <!-- Which outlet do you think reported <span class="pos_color">positively</span> or <span class="neg_color">negatively</span> about <span  :class="category_css_name" class="entity">{{props.data.name}}</span>? -->
            Which outlet do you think reported positively or negatively about <span :class="category_css_name" class="entity">{{props.data.name}}</span>?
            <br>
            <!-- What do you think this outlet would report on other topics related to <span  :class="category_css_name" class="entity">{{props.data.name}}</span>  ? -->
            What do you think this outlet would report on other topics related to it?
        </p>
        <br>
        <p style="font-weight: bold; font-size: 1.1rem">
            Click any outlet icon above to start the quiz!
        </p>
    </div>
    <svg style='position:absolute;pointer-events:none'>
        <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="10" height="10" style="fill:#baf0f5" />
            <line x1="0" y1="0" x2="0" y2="10" style="stroke:#f4c49c; stroke-width:8" />
        </pattern>
    </svg>
    
</template>

<style scoped>
.pos_color {
    background: #baf0f5;
}
.neg_color {
    background: #f4c49c;
}
.mix_color {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect x="0" y="0" width="10" height="10" fill="rgb(186, 240, 245)" /> <line x1="0" y1="10" x2="10" y2="0" stroke="rgb(244, 196, 156)" stroke-width="2.5" /> </svg>');
}
.neu_color {
    background: #dddddd;
}
.entity {
  font-style: italic;
  font-weight: bold;
}

.entity-info-container {
  height: 100%;
  justify-content: space-evenly;
  display: flex;
  flex-direction: column;
  padding: 1% 1% 1% 1%;
  /*! overflow: hidden; */

}
.journal-grid {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 6rem;
  /* width:auto; */
}

.journal-cell {
    margin: 8px;
    display:flex;
    align-items: center;
    height: 5rem;
    width: 15%;
    cursor: pointer;
    animation: pulse 2s infinite;
    border-radius: 40%;
}

.journal-cell:hover .overlay {
    opacity: 1;
}
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(43, 42, 42, 0.5); /* Dark overlay color */
  opacity: 0; /* Initially transparent */
  transition: opacity 0.3s ease; /* Transition effect */
  border-radius: 40%;
}

.journal-image {
    width: 100%;
    height: auto;
}


@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7);
  }

  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
  }

  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
  }
}
.tooltiptext {
  text-align: justify;
  font-size: 1rem;
  font-size: 1rem;
  font-family: 'Lato';
  font-weight: 200;
  box-shadow: rgb(0 0 0 / 25%) 0px 54px 55px, rgb(0 0 0 / 12%) 0px -12px 30px, rgb(0 0 0 / 12%) 0px 4px 6px, rgb(0 0 0 / 17%) 0px 12px 13px, rgb(0 0 0 / 9%) 0px -3px 5px;
}
</style>