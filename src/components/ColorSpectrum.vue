<script setup lang="ts">
import * as d3 from "d3"
import { watch, onMounted, PropType, computed, Ref, ref} from 'vue'


const props = defineProps({
    colorScale: Function,
})

const viewBox = [300, 300]
const steps = 11
const interpolation =  [1,3572] //[...Array(steps).keys()].map(p => p/(steps-1))
const colorScale =  d3.scaleLog().domain([1,3572]).range(["#FFFFFF","#5e0053"]); // hardcoded sorry :( pass article max via a store 

onMounted(() => {
    const svg = d3.select("svg.spectrum-container")
        .attr("viewBox", `0 0 ${viewBox[0]} ${viewBox[1]}`)
    const grad = svg.append("defs").append("linearGradient")
        .attr("id", "grad")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "50%")
        .attr("y2", "50%")
    
    grad.selectAll("stop")
        .data(interpolation)
        .enter()
        .append("stop")
        .style("stop-color", (d) => (colorScale!(d)))
        .attr("offset", (d, i) => (100*(i/(interpolation.length-1)) + '%'))
    svg.append("rect")
        .attr("class", "spectrum")
        .attr("x", 0)
        .attr("y", 0)
        .attr("rx", 2)
        .attr("width", viewBox[0])
        .attr("height", viewBox[1])
        .style("fill", "url(#grad)")
        .attr("stroke-width", 1)
        .attr("stroke", "#f7f7f7")

}) 
</script>

<template>
    <div>
        <svg class="spectrum-container"> </svg>
    </div>
</template>

<style scoped lang="scss">
.spectrum-container {
    width: 100%;
    height: auto;
}
</style>