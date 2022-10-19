<template>
    <div ref="tooltip" :id="id" class="tooltip" v-html="content">
    </div>  
</template>

<script setup lang="ts">
import * as vue from "vue"
import * as d3 from "d3"
const props = defineProps({
    id: String,
    content: String, 
})
const viewBox = [250, 100]
const margin = {top: 10, right: 10, bottom: 10, left: 0}

const fontSizeScale = d3.scaleLinear()
    .domain([0, 100])
    .range([1, 10])
    .clamp(true)

vue.onMounted(() => {
    const svg = d3.select(`#${props.id}`).select("svg")
        .attr("viewBox", `0 0 ${viewBox[0]} ${viewBox[1]}`)
    svg.append("g").attr("class", "canvas")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
})

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