<template>
    <div ref="tooltip" :id="id" class="tooltip" v-html="content">
    </div>  
</template>

<script setup lang="ts">
import * as vue from "vue"
import * as d3 from "d3"
import cloud from "d3-cloud"
import { nextTick } from "vue"
const props = defineProps({
    id: String,
    content: String, 
    hasWordCloud: Boolean,
    words_freq: Object as () => {title: string, freq: number}[],
})
const viewBox = [250, 100]
const margin = {top: 10, right: 10, bottom: 10, left: 0}
const viewBox_width = viewBox[0] - margin.left - margin.right
const viewBox_height = viewBox[1] - margin.top - margin.bottom;

const fontSizeScale = d3.scaleLinear()
    .domain([0, 100])
    .range([1, 10])
    .clamp(true)
const word_freq_dict = vue.computed(() => {
    let dict = {}
    props.words_freq?.forEach(word => {
        dict[word.title] = word.freq
    })
    return dict
})
let word_cloud_layout = cloud()
vue.onMounted(() => {
    if(props.hasWordCloud) {
        nextTick(() => {
            const svg = d3.select(`#${props.id}`).select("svg")
                .attr("viewBox", `0 0 ${viewBox[0]} ${viewBox[1]}`)
            svg.append("g").attr("class", "canvas")
                .attr("transform", `translate(${margin.left}, ${margin.top})`)
            const words = props.words_freq!.map((d) => {
                return {
                    text: d.title.split("-")[0], 
                    size:Math.round(fontSizeScale(d.freq))
                }
            })
            word_cloud_layout = cloud()
                .size(viewBox)
                .words(words)
                .padding(1)
                .rotate(0)
                .fontSize((d) => d.size)
                .on("end", draw)
            word_cloud_layout.start()
        })
    }
})

function draw(words) {
    const canvas = d3.select(`#${props.id}`).select("g.canvas")
    canvas.append("g")
        .attr("class", "words-group")
        .attr("transform", `translate(${word_cloud_layout.size()[0]/2}, ${word_cloud_layout.size()[1]/2})`)
        .selectAll("text.wordcloud_text")
        .data(words)
        .enter().append("text").attr("class", "wordcloud_text")
        .style("font-size", (d) => `${d.size}px`)
        .attr("text-anchor", "middle")
        .attr("transform", (d) => `translate(${d.x}, ${d.y}) rotate(${d.rotate})`)
        .text(d => d.text)
}
</script>

<style scoped>
.tooltip {
    position: absolute;
    background-color: #fcf1dd;
    border: solid;
    border-width: 2px;
    border-radius: 5px;
    padding: 5px;
    pointer-events: none;
    transform-origin: top left;
    z-index: 1000;
}
</style>