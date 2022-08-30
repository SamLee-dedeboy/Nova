<script setup lang="ts">
import ScrollPanel from 'primevue/scrollpanel'
import Panel from 'primevue/panel'
import Chip from 'primevue/chip'
import ToggleButton from 'primevue/togglebutton'
import { nextTick } from 'vue'
import * as d3 from "d3";
// import Dialog from "primevue/dialog"
import * as vue from "vue"
import * as SstColors from "./ColorUtils"
import { Ref, ref } from "vue"
import { Article, Sentiment2D } from "../types"
import { articlesToRadius } from './NodeUtils'


const props = defineProps({
    articles: Object as () => Article[],
    sst_threshold: Sentiment2D,
})

const emit = defineEmits(["update:sst_threshold"])

const sorted_articles = vue.computed(() => {
    return props.articles?.sort((a1, a2) => {
        const s1 = a1.sentiment.normalized_sst || 0
        const s2 = a2.sentiment.normalized_sst || 0
        return s1 - s2
    })
    // const pos_articles = props.articles?.filter(article => isPositive(article.sentiment.normalized_sst!))
    // const neg_articles = props.articles?.filter(article => isNegative(article.sentiment.normalized_sst!))
    // const neu_articles = props.articles?.filter(article => isNeutral(article.sentiment.normalized_sst!))

    // const sorted_pos_articles = pos_articles?.sort((a1, a2) => a1.sentiment.normalized_sst! - a2.sentiment.normalized_sst!) || []
    // const sorted_neg_articles = neg_articles?.sort((a1, a2) => a2.sentiment.normalized_sst! - a1.sentiment.normalized_sst!) || []
    // const sorted_neu_articles = neu_articles?.sort((a1, a2) => a1.sentiment.normalized_sst! - a2.sentiment.normalized_sst!) || []
    // return sorted_pos_articles?.concat(sorted_neg_articles, sorted_neu_articles)
})
function sstToColor(sst) {
    if(isNeutral(sst)) return SstColors.neu_color
    if(sst >= 0) return SstColors.pos_color
    else return SstColors.neg_color
}

function isPositive(sst_score: number) {
    return sst_score > 0 && sst_score >= props.sst_threshold!.pos
}

function isNegative(sst_score: number) {
    return sst_score < 0 && Math.abs(sst_score) >= Math.abs(props.sst_threshold!.neg)
}
function isNeutral(sst_score: number) {
    if(sst_score >= 0) return sst_score < props.sst_threshold!.pos
    else if(sst_score < 0) return Math.abs(sst_score) < Math.abs(props.sst_threshold!.neg)
}

function adjustThreshold(article) {
    const sst = article.sentiment.normalized_sst!
    if(sst >= 0) props.sst_threshold!.pos = sst
    else if(sst < 0) props.sst_threshold!.neg = Math.abs(sst)
    emit('update:sst_threshold', props.sst_threshold)
}
</script>

<template>
<ScrollPanel class="article-list-container">
    <Panel v-for="(article, index) in sorted_articles"
    :header="index+1 + '. ' + article.headline"
    :key="article.id"
    :toggleable=true
    :collapsed=true 
    :style="{
        'background-color': sstToColor(article.sentiment.normalized_sst), 
        'filter': `brightness(${SstColors.brightness}%)`,
        }">
    <template #header>
        <span>
            {{index+1 + '. ' + article.headline}}
        </span>
        <!-- <Chip :style="{'background-color': this.color_neg(article.sentiment)}">  -->
        <ToggleButton class="flip-button" 
        onLabel="flip"
        offLabel="flip"
        :value="isNeutral(article.sentiment.normalized_sst!)"
        @change="adjustThreshold(article)"
        ></ToggleButton>
        <Chip >
            {{article.sentiment.normalized_sst?.toFixed(2)}}
        </Chip>
        
    </template>
    <ScrollPanel style="width: 100%; height: 200px">
        {{article.content}}
    </ScrollPanel>
    </Panel>
</ScrollPanel>
</template>
<style scoped>
:deep(.p-panel-header) {
    cursor: pointer;
    background: unset !important;
    color: #25272a !important;
}
:deep(.p-panel .p-panel-header .p-panel-header-icon) {
  color: #25272a !important;
} 

.article-list-container {
  height: 95%;
}

</style>