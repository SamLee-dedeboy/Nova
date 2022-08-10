<script setup lang="ts">
import * as d3 from "d3"
import * as vue from "vue"
import * as preprocess from "../components/preprocessUtils"
import * as SstColors from "./ColorUtils"
import { Path, Article, Sentiment2D } from "../types"
import { start } from "repl"
import {Ref, ref} from 'vue'
import { processSlotOutlet } from "@vue/compiler-core"
const props = defineProps({
    id: String,
    topicBins: Object as () => {[id: string]: {pos: number, neg: number}},
})
const viewBox = [500, 300]
const margin = {top: 30, bottom: 30, right:10, left: 30, middle: 10} 
const viewBox_width = viewBox[0] - margin.left - margin.right
const viewBox_height = viewBox[1] - margin.top - margin.bottom - margin.middle
const max_articles = vue.computed(() => {
    if(props.topicBins === undefined) return 10
    else {
        return Math.max(...(Object.keys(props.topicBins).map(topic => props.topicBins![topic].pos + props.topicBins![topic].neg)))
    }
})
const abbr_dict = {
    "MiscellaneousPolicies": "Miscellaneous",
    "EconomicPolicies": "Economic",
    "ContainmentandClosurePolicies": "Closure",
    "HealthSystemPolicies": "HealthSystem"
}
let x = d3.scaleBand()
let y = d3.scaleLinear()
vue.watch(() => props.topicBins, (new_value, old_value) => {
    // update y axis
    y = d3.scaleLinear()
        .domain([0, max_articles.value])
        .range([viewBox_height, 0])
    d3.select(`#${props.id}`).select("svg").select("g.y-axis-group")
        .call(d3.axisLeft(y))
    // update bars
    updateBars()
})
vue.onMounted(() => {
    const svg = d3.select(`#${props.id}`).select("svg")
        .attr("viewBox", `0 0 ${viewBox[0]} ${viewBox[1]}`)
    svg.append("g")
        .attr("class", "canvas")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
    // x axis
    x = d3.scaleBand()
        .range([ 0, viewBox_width ])
        .domain(Object.keys(props.topicBins!).sort())
        .padding(0.2);
    const canvas = svg.select("g.canvas")
    canvas.append("g").attr("class", "x-axis-group")
        .attr("transform", `translate(0, ${viewBox_height})`)
        .call(d3.axisBottom(x).tickFormat((d) => abbr_dict[d]))
    // y axis
    y = d3.scaleLinear()
        .domain([0, max_articles.value])
        .range([viewBox_height, 0])
    canvas.append("g").attr("class", "y-axis-group")
        .call(d3.axisLeft(y))
    
    canvas.append("g").attr("class", "bars-group")
    updateBars()
})

function updateBars() {
    const bars_group = d3.select(`#${props.id}`).select("g.bars-group")
    const rect_group = bars_group.selectAll("g.rect_group")
        .data(Object.keys(props.topicBins!))
    rect_group.enter().append("g").attr("class", "rect_group")
    const pos_rect = bars_group.selectAll("g.rect_group").selectAll("rect.pos_rect")
        .data((d) => [{topic: d, freqs:props.topicBins![d]}])
    pos_rect.enter().append("rect").attr("class", "pos_rect")
        .merge(pos_rect)
        .attr("width", x.bandwidth())
        .attr("x", (d) => x(d.topic))
        .attr("y", (d) => y(d.freqs.pos))
        .attr("height", (d) => viewBox_height-y(d.freqs.pos))
        .attr("fill", SstColors.pos_color)
        .style("filter", `brightness(${SstColors.brightness}%)`)

    const neg_rect = bars_group.selectAll("g.rect_group").selectAll("rect.neg_rect")
        .data((d) => [{topic: d, freqs:props.topicBins![d]}])
    neg_rect.enter().append("rect").attr("class", "neg_rect")
        .merge(neg_rect)
        .attr("width", x.bandwidth())
        .attr("x", (d) => x(d.topic))
        .attr("y", (d) => y(d.freqs.neg + d.freqs.pos))
        .attr("height", (d) => viewBox_height-y(d.freqs.neg))
        .attr("fill", SstColors.neg_color)
        .style("filter", `brightness(${SstColors.brightness}%)`)

        
    // bars.enter()
    //     .append("rect")
    //     .attr("width", x.bandwidth())
    //     .merge(bars)
    //     .attr("x", (d) => (x(d)))
    //     .attr("y", (d) => (y(props.topicBins![d])))
    //     .attr("height", (d) => viewBox_height-y(props.topicBins![d]))
    //     .attr("fill", "grey")




}
</script>
<template>
   <div class="article-info-container" :id="id">
   <svg class="article-topic-barchart"></svg>


   </div> 
</template>