<script setup lang="ts">
import * as d3 from "d3";
import * as SstColors from "./ColorUtils"
import * as vue from "vue"
const r = 7
const x_offset = 25 
const vertical_margin = 2*r 
const horizontal_margin = 2*r

const props = defineProps({
    id: String,
    color_dict: Object as () => {[id: string]: string},
    filter: Boolean,
    interactable: Boolean,
})
const emit = defineEmits(['outlet-hovered'])
vue.onMounted(()=> {
    var svg = d3.select(`#${props.id}`)
    var index = 0
    const len = Object.keys(props.color_dict!).length
    svg.attr("height", len*30 + "px")
    const y_offset = (200-(len+0.2)*(2*r+vertical_margin))/2
    for(const [title, color] of Object.entries(props.color_dict!)) {
        console.log("🚀 ~ file: Legend.vue ~ line 23 ~ vue.onMounted ~ outlet", title)
        const circle = svg.append("circle")
            .attr("cx", x_offset)
            .attr("cy", y_offset + index*(2*r + vertical_margin))
            .attr("r", r)
            // .style("filter", `brightness(${SstColors.brightness}%)`)
            .style("fill", color)
        if(props.filter) circle.style("filter", `brightness(${SstColors.brightness}%)`)
        if(title === "no mention") {
            circle.attr("stroke", "black")
                .attr("stroke-dasharray", 1.5)
        }

        svg.append("text")
            .attr("x", x_offset + 2*r + horizontal_margin)
            .attr("y", y_offset + index*(2*r + vertical_margin))
            .text(title)
            .attr("font-size", "large")
            .attr("dominant-baseline", "middle")
        if(props.interactable) {
            const rect = svg.append("rect")
                .attr("x", x_offset - r)
                .attr("y", y_offset - 2*r + index*(2*r + vertical_margin))
                .attr("width", 180 )
                .attr("height", 2*r+vertical_margin)
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
    <svg  viewBox="0 0 200 175" :id="id">
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
    /* pointer-events: none; */
    transform-origin: top left;
}
</style>