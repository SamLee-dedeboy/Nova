<script setup lang="ts">
import ScrollPanel from 'primevue/scrollpanel'
import VirtualScroller from 'primevue/virtualscroller/VirtualScroller'
import Panel from 'primevue/panel'
import Chip from 'primevue/chip'
import { nextTick } from 'vue'
import * as d3 from "d3";
// import Dialog from "primevue/dialog"
import * as vue from "vue"
import * as SstColors from "./ColorUtils"
import { Ref, ref } from "vue"
import { Article } from "../types"


const props = defineProps({
    articles: Object as () => Article[],
})

function sstToColor(sst) {
    if(sst >= 0) return SstColors.pos_color
    else return SstColors.neg_color
}
</script>

<template>
<VirtualScroller class="article-list-container"
    :items="articles"
    :itemSize="20">
    <template v-slot:item="{item, options}">
    <Panel
    :header="options.index+1 + '. ' + item.headline"
    :key="item.id"
    :toggleable=true
    :collapsed=true 
    :style="{
        'background-color': sstToColor(item.sentiment.normalized_sst), 
        'filter': `brightness(${SstColors.brightness}%)`,
        }">
    <template #header>
        <span>
            {{options.index+1 + '. ' + item.headline}}
        </span>
        <!-- <Chip :style="{'background-color': this.color_neg(article.sentiment)}">  -->
        <Chip >
            {{item.sentiment.normalized_sst?.toFixed(2)}}
        </Chip>
        
    </template>
    <ScrollPanel style="width: 100%; height: 200px">
        {{item.content}}
    </ScrollPanel>
    </Panel>

    </template>
</VirtualScroller>
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
</style>