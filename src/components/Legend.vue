<script setup lang="ts">
import * as d3 from "d3";
import * as SstColors from "./ColorUtils"
import * as vue from "vue"

const props = defineProps({
    id: String,
    color_dict: Object as () => {[id: string]: string},
    filter: Boolean,
    interactable: Boolean,
})
const emit = defineEmits(['outlet-hovered'])
vue.onMounted(()=> {
    const len = Object.keys(props.color_dict!).length
    const param = {top: 3, bottom: 0, left: 2, vertical: 2}
    const r = 175/(param.top+param.bottom+2*len+param.vertical*(len-1))
    const margin = {top: param.top*r, bottom: param.bottom*r, left: param.left*r, vertical: param.vertical*r}
    var svg = d3.select(`#${props.id}`)
    var index = 0
    // svg.attr("height", margin.top + margin.bottom + len*2*r + (len-1)*margin.vertical + "px")
    for(const [title, color] of Object.entries(props.color_dict!)) {
        const circle = svg.append("circle")
            .attr("cx", margin.left)
            .attr("cy", margin.top + index*(2*r + margin.vertical))
            .attr("r", r)
            // .style("filter", `brightness(${SstColors.brightness}%)`)
            .style("fill", color)
        if(props.filter) circle.style("filter", `brightness(${SstColors.brightness}%)`)
        if(title === "no mention") {
            circle.attr("stroke", "black")
                .attr("stroke-dasharray", 1.5)
        }

        svg.append("text")
            .attr("x", margin.left + 2*r)
            .attr("y", margin.top + index*(2*r + margin.vertical))
            .text(title)
            .attr("font-size", "small")
            .attr("dominant-baseline", "middle")
        if(props.interactable) {
            const rect = svg.append("rect")
                .attr("x", margin.left - r)
                .attr("y", margin.top - 2*r + index*(2*r + margin.vertical))
                .attr("width", 180 )
                .attr("height", 2*r+margin.vertical)
                .style("fill", "none")
                .style("cursor", "pointer")
                .style("pointer-events", "all")
                .on("mouseover", () => {
                    emit("outlet-hovered", title)
                })
                .on("mouseout", () => {
                    emit("outlet-hovered", undefined)
                })
                .raise()
        }
        index += 1
    }
})

</script>

<template>
    <div class="legend-container">
        <svg  class="legend-svg" viewBox="0 0 150 175" :id="id">
        </svg>
    </div>
</template>

<style scoped>
.legend-container {
    width: fit-content;
    background-color: #eee3cd;
    border: solid;
    border-width: 2px;
    border-radius: 5px;
    padding: 5px;
    /* pointer-events: none; */
    transform-origin: top left;
}
.legend-svg {
    width: 100%;
    height: 100%;
}
</style>