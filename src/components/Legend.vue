<script>
import * as d3 from "d3";

export default {
    props:["key_color_pair", "brightness"],
    mounted() {
        const r = 7
        const x_offset = 30
        const y_offset = 10
        const vertical_margin = 2*r 
        const horizontal_margin = 2*r
        var svg = d3.select("#legend")
        this.key_color_pair.forEach((pair,index) => {
            const key = pair[0]
            const color = pair[1]
            console.log("🚀 ~ file: Legend.vue ~ line 17 ~ this.key_color_pair.forEach ~ color", color)
            const circle = svg.append("circle")
                .attr("cx", x_offset)
                .attr("cy", y_offset + index*(2*r + vertical_margin))
                .attr("r", r)
                .style("filter", `brightness(${this.brightness}%)`)
                .style("fill", color)
            if(key === "no mention") {
                circle.attr("stroke", "black")
                    .attr("stroke-dasharray", 1.5)
            }
    
            svg.append("text")
                .attr("x", x_offset + 2*r + horizontal_margin)
                .attr("y", y_offset + index*(2*r + vertical_margin))
                .text(key)
                .attr("font-size", "large")
                .attr("dominant-baseline", "middle")
        })

    },
}

</script>

<template>
    <svg  viewBox="0 0 180 100" id="legend">
    </svg>
</template>

<style scoped>
svg {
    width:150px;
    height:100px;
    background-color: #eee3cd;
    border: solid;
    border-width: 2px;
    border-radius: 5px;
    padding: 5px;
    pointer-events: none;
    transform-origin: top left;
}
</style>