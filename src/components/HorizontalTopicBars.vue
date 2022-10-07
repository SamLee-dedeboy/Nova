<script setup lang="ts">
import * as d3 from "d3"
import * as vue from "vue"
import * as SstColors from "./utils/ColorUtils"
const props = defineProps({
    id: String,
    targetTopicBins: Object as () => { [id: string]: {pos: number, neg: number}},
    cooccurrTopicBins: Object as () => { [id: string]: {pos: number, neg: number}},
})
const viewBox = [750, 400]
const margin = {top: 30, bottom: 20, right:10, left: 150, middle: 10} 
const viewBox_width = viewBox[0] - margin.left - margin.right
const viewBox_height = viewBox[1] - margin.top - margin.bottom - margin.middle
const max_articles = vue.computed(() => {
    if(props.targetTopicBins === undefined) return 10
    else {
        return Math.max(...(Object.keys(props.targetTopicBins).map(topic => props.targetTopicBins![topic].pos + props.targetTopicBins![topic].neg)))
    }
})
const bar_num = vue.computed(() => props.cooccurrTopicBins? 2:1)
const abbr_dict = {
    "MiscellaneousPolicies": "Miscellaneous",
    "EconomicPolicies": "Economic",
    "ContainmentandClosurePolicies": "Closure",
    "HealthSystemPolicies": "HealthSystem"
}
let x: any = d3.scaleBand()
let y: any = d3.scaleLinear()

vue.watch(() => props.targetTopicBins, (new_value, old_value) => {
    // update y axis
    y = d3.scaleLinear()
        .domain([0, max_articles.value])
        .range([viewBox_height, 0])
    d3.select(`#${props.id}`).select("svg").select("g.y-axis-group")
        .call(d3.axisLeft(y) as any)
    // update bars
    updateBars()
})

vue.watch(() => props.cooccurrTopicBins, (new_value, old_value) => {
    // update bars
    updateBars()
})

vue.onMounted(() => {
    const svg = d3.select(`#${props.id}`).select("svg")
        .attr("viewBox", `0 0 ${viewBox[0]} ${viewBox[1]}`)
    svg.append("g")
        .attr("class", "canvas")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
    const canvas = svg.select("g.canvas")
    // x axis
    x = d3.scaleLinear()
        .domain([0, max_articles.value])
        .range([0, viewBox_width])
    canvas.append("g").attr("class", "x-axis-group")
        .attr("transform", `translate(0, ${viewBox_height})`)
        .style("font-size", "1rem")
        .call(d3.axisBottom(x))
    
    // y axis
    y = d3.scaleBand()
        .domain(Object.keys(props.targetTopicBins!).sort())
        .range([ 0, viewBox_height ])
        .padding(0.2);
    canvas.append("g").attr("class", "y-axis-group")
        .style("font-size", "1.25rem")
        .call(d3.axisLeft(y).tickFormat((d: any) => abbr_dict[d]))
    canvas.append("g").attr("class", "bars-group")
    updateBars()
})

function updateBars() {
    const bars_group = d3.select(`#${props.id}`).select("g.bars-group")
    bars_group.selectAll("g.topic")
        .data(Object.keys(props.targetTopicBins!))
        .enter()
        .append("g").attr("class", "topic")

    const target_rects: any = bars_group.selectAll("g.topic").selectAll("rect.target")
        .data((d: any) => { return [{topic: d, num: props.targetTopicBins![d].pos + props.targetTopicBins![d].neg}]})
    target_rects.enter().append("rect")
        .attr("class", "target")
        .attr("y", y(0))
        .merge(target_rects)
            .attr("height", (d) => y.bandwidth())
            .attr("x", (d) => 0)
            .attr("y", (d: any) => y(d.topic) + 0)
            .transition().duration(1000)
            .attr("width", (d) => x(d.num))
            .attr("fill", SstColors.topic_main_color)
            .attr("stroke", "black")
            .style("filter", `brightness(${SstColors.brightness}%)`)
    if(props.cooccurrTopicBins) {
        const cooccurr_rects: any = bars_group.selectAll("g.topic").selectAll("rect.cooccurr")
            .data((d: any) => { return [{topic: d, num: (props.cooccurrTopicBins![d]?.pos||0) + (props.cooccurrTopicBins![d]?.neg||0)}]})
        cooccurr_rects.enter().append("rect")
            .attr("class", "cooccurr")
            .attr("y", y(0))
            .merge(cooccurr_rects)
                .attr("height", (d) => y.bandwidth()-1)
                // .attr("x", (d: any) => x(d.topic) + x.bandwidth()/bar_num.value)
                .attr("x", (d) => 1)
                .attr("y", (d: any) => y(d.topic) + 0 - 1)
                .transition().duration(1000)
                .attr("width", (d) => x(d.num))
                .attr("fill", SstColors.topic_fill_color)
                .style("filter", `brightness(${SstColors.brightness}%)`)
    } else {
        bars_group.selectAll("g.topic").selectAll("rect.cooccurr").remove()
    }




}
</script>
<template>
   <div class="topic-barchart-container" :id="id">
    <svg class="topic-barchart"></svg>
   </div> 
</template>
<style scoped>
.topic-barchart-container {
    height: 100%;
    width: 59%;
}
.topic-barchart {
    height: 100%
}
</style>