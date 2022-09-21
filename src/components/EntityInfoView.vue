<script setup lang="ts">
import * as vue from "vue"
import * as d3 from "d3"
import { updateOverviewGrid } from "./utils/TutorialUtils";
import SelectButton from "primevue/selectbutton"
import * as SstColors from "./utils/ColorUtils"
import { SentimentType, Sentiment2D, EntityInfo } from "../types"
import { Ref, ref } from "vue"
const props = defineProps({
    title: String,
    entity_info: EntityInfo,
    segmentation: Sentiment2D,

})

const emit = defineEmits(['update:segmentation'])

const viewBox = [100, 20]
const canvas_width = 100
const canvas_height = 20
const pos_ratio = vue.computed(() => {
    const pos = props.entity_info?.sst_ratio?.pos_artcs || 0
    const neg = props.entity_info?.sst_ratio?.neg_artcs || 0
    return pos / (pos + neg)
})
const neg_ratio = vue.computed(() => {
    return 1-pos_ratio.value
})

const selectedCategory: Ref<any> = ref({})
vue.watch(selectedCategory, (new_value, old_value) => {
    if(props.segmentation === undefined || props.entity_info === undefined) return
    const adjust_target: Sentiment2D = props.entity_info.sst_ratio || {pos: 0.5, neg: 0.5}
    const offset = 0.05
    if(new_value.type === SentimentType.neu) {
        props.segmentation.pos = adjust_target.pos + offset
        props.segmentation.neg = adjust_target.neg + offset
    }
    if(new_value.type === SentimentType.neg) {
        props.segmentation.pos = adjust_target.pos + offset
        props.segmentation.neg = adjust_target.neg - offset
    }
    if(new_value.type === SentimentType.pos) {
        props.segmentation.pos = adjust_target.pos - offset
        props.segmentation.neg = adjust_target.neg + offset
    }
    if(new_value.type === SentimentType.mix) {
        props.segmentation.pos = adjust_target.pos - offset
        props.segmentation.neg = adjust_target.neg - offset
    }
    emit("update:segmentation", props.segmentation)

})
const sentiment_options = [
    {type: SentimentType.neu, value: "neu"}, 
    {type: SentimentType.neg, value: "neg"}, 
    {type: SentimentType.pos, value: "pos"}, 
    {type: SentimentType.mix, value: "mix"}, 
]
vue.onMounted(() => {
    const svg = d3.selectAll("svg.entity-sst-ratio")
        .attr("viewBox", `0 0 ${viewBox[0]} ${viewBox[1]}`)
        .attr("width", `${canvas_width}px`)
        .attr("height", `${canvas_height}px`)
    updateSstRect()
})

function updateSstRect() {
    const svg = d3.selectAll("svg.entity-sst-ratio")
    const pos_rect: any = svg.selectAll("rect.pos_rect")
        .data([pos_ratio.value])
    pos_rect.enter().append('rect').attr("class", "pos_rect")
        .merge(pos_rect)
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", (d) => d*viewBox[0])
        .attr("height", viewBox[1])
        .attr("fill", SstColors.pos_color)
        .style("filter", `brightness(${SstColors.brightness}%)`)
    const neg_rect: any = svg.selectAll("rect.neg_rect")
        .data([neg_ratio.value])
    neg_rect.enter().append('rect').attr("class", "neg_rect")
        .merge(neg_rect)
        .attr("x", (d) => (1-d)*viewBox[0])
        .attr("y", 0)
        .attr("width", (d) => d*viewBox[0])
        .attr("height", viewBox[1])
        .attr("fill", SstColors.neg_color)
        .style("filter", `brightness(${SstColors.brightness}%)`)

}
</script>
<template>
    <div class="entity-info-view-container">
        <div class="title">{{props.title}}</div>
        <div class="entity-name" :title="props.entity_info?.name">{{"id: " + props.entity_info?.name || "unknown"}}</div>
        <div class="outlet-name">{{"journal: " + props.entity_info?.outlet || "unknown"}}</div>
        <div class="num-of-mention">{{"#mentions: " + props.entity_info?.num_of_mentions || "unknown"}}</div>

    </div>
        <!-- <SelectButton
            v-if="props.segmentation"
            v-model="selectedCategory"
            :options="sentiment_options"
            option-label="value"
            data-key="type" >
        </SelectButton> -->

</template>

<style scoped>
div {
    font-size:small;
    overflow: hidden;
    white-space: nowrap;
}
.entity-info-view-container {
max-width: 50%;
}
</style>