<script setup lang="ts">
import ScrollPanel from 'primevue/scrollpanel'
import Panel from 'primevue/panel'
import Chip from 'primevue/chip'
import DeferreedContent from 'primevue/deferredcontent'
import ToggleButton from 'primevue/togglebutton'
import { nextTick } from 'vue'
import * as d3 from "d3";
// import Dialog from "primevue/dialog"
import * as vue from "vue"
import * as SstColors from "./ColorUtils"
import { Ref, ref } from "vue"
import { Article, Sentiment2D, Sentiment } from "../types"
import { articlesToRadius } from './NodeUtils'


const props = defineProps({
    articles: Object as () => Article[],
    sst_ratio: Object as () => {
        pos_artcs: number,
        neg_artcs: number,
        pos: number,
        neg: number,
    },
    sst_threshold: Sentiment2D,
})

const emit = defineEmits(["update:sst_threshold"])

vue.onMounted(() => {
    const pos_scroll_panel = document.querySelector(".pos-article-list > .p-scrollpanel-wrapper > .p-scrollpanel-content")
    const neg_scroll_panel = document.querySelector(".neg-article-list > .p-scrollpanel-wrapper > .p-scrollpanel-content")
    pos_scroll_panel?.addEventListener("scroll", function(event) {
        const element = event.target as HTMLElement
        if (element.scrollHeight - element.scrollTop === element.clientHeight) {
            const old_len = pos_panel_articles.value.length
            const next_ten_articles: Article[] | undefined = pos_articles.value?.slice(old_len, old_len+10)
            if(next_ten_articles)
                pos_panel_articles.value = pos_panel_articles.value.concat(next_ten_articles)
        }
    })
    neg_scroll_panel?.addEventListener("scroll", function(event) {
        const element = event.target as HTMLElement
        if (element.scrollHeight - element.scrollTop === element.clientHeight) {
            const old_len = neg_panel_articles.value.length
            const next_ten_articles: Article[] | undefined = neg_articles.value?.slice(old_len, old_len+10)
            if(next_ten_articles)
                neg_panel_articles.value = neg_panel_articles.value.concat(next_ten_articles)
        }
    })
})
const sorted_articles = vue.computed(() => {
    return props.articles?.sort((a1, a2) => {
        const s1 = a1.sentiment.score || 0
        const s2 = a2.sentiment.score || 0
        return s1 - s2
    })
})
const pos_articles = vue.computed(() => {
    return props.articles?.filter(article => article.sentiment.label === "POSITIVE")
})
const pos_panel_articles: Ref<Article[]> = ref(pos_articles.value?.splice(0,10) || []) 
const neg_articles = vue.computed(() => {
    return props.articles?.filter(article => article.sentiment.label === "NEGATIVE")
})
const neg_panel_articles: Ref<Article[]> = ref(pos_articles.value?.splice(0,10) || []) 

function sstToColor(sst: number) {
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
    const sst = article.sentiment
    if(sst >= 0) props.sst_threshold!.pos = sst
    else if(sst < 0) props.sst_threshold!.neg = Math.abs(sst)
    emit('update:sst_threshold', props.sst_threshold)
}
</script>

<template>
<DeferredContent>
<ScrollPanel class="pos-article-list">
    <Panel v-for="(article, index) in pos_panel_articles"
    :header="index+1 + '. ' + article.headline"
    :key="article.id"
    :toggleable=true
    :collapsed=true 
    :style="{ 'background-color': SstColors.pos_color, 'filter': `brightness(${SstColors.brightness}%)`, }">
    <template #header>
        <span>
            {{index+1 + '. ' + article.headline}}
        </span>
        <!-- <Chip >
            {{article.sentiment.score.toFixed(2)}}
        </Chip> -->
    </template>
    <ScrollPanel style="width: 100%; height: 200px">
        {{article.summary}}
    </ScrollPanel>
    </Panel>
</ScrollPanel>

<ScrollPanel class="neg-article-list">
    <Panel v-for="(article, index) in neg_panel_articles"
    :header="index+1 + '. ' + article.headline"
    :key="article.id"
    :toggleable=true
    :collapsed=true 
    :style="{ 'background-color': SstColors.neg_color, 'filter': `brightness(${SstColors.brightness}%)`, }">
    <template #header>
        <span>
            {{index+1 + '. ' + article.headline}}
        </span>
        <!-- <Chip >
            {{article.sentiment.score.toFixed(2)}}
        </Chip> -->
    </template>
    <ScrollPanel style="width: 100%; height: 200px">
        {{article.summary}}
    </ScrollPanel>
    </Panel>
</ScrollPanel>
</DeferredContent>
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

.pos-article-list, .neg-article-list {
    height: 50%;
}

</style>