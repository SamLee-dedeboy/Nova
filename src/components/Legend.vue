<script setup lang="ts">
import * as d3 from "d3";
import * as SstColors from "./utils/ColorUtils"
import * as vue from "vue"

const props = defineProps({
    id: String,
    color_dict: Object as () => {[id: string]: string},
    filter: Boolean,
    interactable: Boolean,
})

vue.onMounted(()=> {
    const len = Object.keys(props.color_dict!).length
    const margin = {top: 6, bottom: 10, left: 5, right: 5, vertical: 5}
    const row_height = 4 
    const viewBox = [150, margin.top + margin.bottom + len*(margin.vertical + row_height)]
    var svg = d3.select(`#${props.id}`)
        .attr("viewBox", `0 0 125 125`)
        .attr("height", '100%')
    var index = 0
    for(const [title, color] of Object.entries(props.color_dict!)) {
        const circle = svg.append("circle")
            .attr("cx", margin.left)
            .attr("cy", margin.top + index*(2*row_height + margin.vertical))
            .attr("r", row_height)
            // .style("filter", `brightness(${SstColors.brightness}%)`)
            .style("fill", color)
            .style("stroke", 'black')
            .style("stroke-opacity", '15%');

        if(props.filter) circle.style("filter", `brightness(${SstColors.brightness}%)`)
        if(title === "no mention") {
            circle.attr("stroke", "black")
                .attr("stroke-dasharray", 1.5)
        }

        svg.append("text")
            .attr("x", margin.left + 2*row_height)
            .attr("y", margin.top + index*(2*row_height + margin.vertical))
            .text(title)
            .attr("font-size", "0.6rem")
            .attr("dominant-baseline", "middle")
            .style("font-family", 'Roboto')
            .style("font-weight", '100')
            .style("font-size", '0.5em')
        // index is used for vertical offset calculation
        index += 1
    }
})

</script>

<template>
    <div class="legend-container">
        <svg  class="legend-svg" viewBox="0 0 125 125" :id="id">
        </svg>
    </div>
</template>

<style scoped>
.legend-container {
    width: 100%;
    height: 100%;
    /* background-color: #eee3cd;
    border: solid;
    border-width: 2px;
    border-radius: 5px; */
    /* padding: 5px; */
    /* pointer-events: none; */
    transform-origin: top left;
}
.legend-svg {
    width: 100%;
    height: 100%;
}
</style>