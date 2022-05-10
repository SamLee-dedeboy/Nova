<script>
import * as d3 from "d3";
import { nextTick } from 'vue'

export default {

    mounted() {
        const r = 5
        const x_offset = 10
        const y_offset = 30
        const vertical_margin = 2*r 
        const horizontal_margin = 2*r
        var svg = d3.select("#legend")
        svg.append("circle")
            .attr("cx", x_offset)
            .attr("cy", y_offset)
            .attr("r", r)
            .style("fill", "red")

        svg.append("circle")
            .attr("cx", x_offset)
            .attr("cy", y_offset + 2*r + vertical_margin)
            .attr("r", r)
            .style("fill", "blue")
        svg.append("circle")
            .attr("cx", x_offset)
            .attr("cy", y_offset + 2*(2*r + vertical_margin))
            .attr("r", r)
            .style("fill", "grey")

        svg.append("circle")
            .attr("cx", x_offset)
            .attr("cy", y_offset + 3*(2*r + vertical_margin))
            .attr("r", r)
            .style("fill", "white")
            .attr("stroke", "black")
            .attr("stroke-dasharray", 1.5)

        svg.append("text")
            .attr("x", x_offset + 2*r + horizontal_margin)
            .attr("y", y_offset)
            .text("positive")
            .attr("font", "small")
            .attr("dominant-baseline", "middle")
        
        svg.append("text")
            .attr("x", x_offset + 2*r + horizontal_margin)
            .attr("y", y_offset + 2*r + vertical_margin)
            .text("negative")
            .attr("font", "small")
            .attr("dominant-baseline", "middle")

        svg.append("text")
            .attr("x", x_offset + 2*r + horizontal_margin)
            .attr("y", y_offset + 2*(2*r + vertical_margin))
            .text("neutral")
            .attr("font", "small")
            .attr("dominant-baseline", "middle")

        svg.append("text")
            .attr("x", x_offset + 2*r + horizontal_margin)
            .attr("y", y_offset + 3*(2*r + vertical_margin))
            .text("no mention")
            .attr("font", "small")
            .attr("dominant-baseline", "middle")

    },

    
          
}




</script>
<template>
<svg  viewBox="0 0 150 150" id="legend" style="position:absolute;left:85%">

</svg>
</template>
