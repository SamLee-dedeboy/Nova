<script setup lang="ts">
import * as d3 from "d3";
import * as SstColors from "./ColorUtils"
import { watch, computed, onMounted, PropType, ref, Ref} from 'vue'
const r = 7
const x_offset = 25 
const vertical_margin = 2*r 
const horizontal_margin = 2*r

const props = defineProps({
    color_dict: Object as () => {[id: string]: string},
    filter: Boolean,

})
onMounted(()=> {
    var svg = d3.select("#legend")
    var index = 0
    const len = Object.keys(props.color_dict!).length
    const y_offset = (200-(len+0.2)*(2*r+vertical_margin))/2
    for(const [outlet, color] of Object.entries(props.color_dict!)) {
        const circle = svg.append("circle")
            .attr("cx", x_offset)
            .attr("cy", y_offset + index*(2*r + vertical_margin))
            .attr("r", r)
            // .style("filter", `brightness(${SstColors.brightness}%)`)
            .style("fill", color)
        if(props.filter) circle.style("filter", `brightness(${SstColors.brightness}%)`)
        if(outlet === "no mention") {
            circle.attr("stroke", "black")
                .attr("stroke-dasharray", 1.5)
        }

        svg.append("text")
            .attr("x", x_offset + 2*r + horizontal_margin)
            .attr("y", y_offset + index*(2*r + vertical_margin))
            .text(outlet)
            .attr("font-size", "large")
            .attr("dominant-baseline", "middle")
        index += 1
    }
})

</script>

<template>
    <svg  viewBox="0 0 200 175" id="legend">
    </svg>
</template>

<style scoped>
svg {
    width: 25%;
    /* aspect-ratio: 1; */
    background-color: #eee3cd;
    border: solid;
    border-width: 2px;
    border-radius: 5px;
    padding: 5px;
    pointer-events: none;
    transform-origin: top left;
}
</style>