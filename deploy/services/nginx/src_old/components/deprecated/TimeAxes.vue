<script>
import * as d3 from "d3";

export default {
    props:["selectedTimeRange"],

    data() {
        return {
            monthLabel: ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec", "Jan"]
        }
    },

    mounted() {
        let scale = d3.scaleLinear().domain([1, 13]).range([10, 400]);
        let axisGenerator = d3.axisLeft(scale)
        axisGenerator.tickFormat((d, i) => this.monthLabel[i])
        let monthAxis = d3.select('svg.timeaxes').append("g")
        monthAxis.append("rect").attr("class", "shadow")
        monthAxis.call(axisGenerator);
        this.updateAxis()
    },

    watch: {
        selectedTimeRange: function() {
            this.updateAxis()
        }
    },

    methods: {
        updateAxis() {
            const tick_size = 30
            let monthAxis = d3.select('svg.timeaxes g')
            monthAxis.selectAll("g.tick line")
                .attr("x2", (d) => (d>=this.selectedTimeRange[0]&&d<=this.selectedTimeRange[1])?tick_size:6);
            let shadow = d3.select("svg.timeaxes rect.shadow")
            let startTick = monthAxis.select(":nth-child(" + (this.selectedTimeRange[0]+2)+ ")").attr("transform").replace(/translate\(/i, "").replace(/\)/i, "").split(",")[1]
            let endTick = monthAxis.select(":nth-child(" + (this.selectedTimeRange[1]+2)+ ")").attr("transform").replace(/translate\(/i, "").replace(/\)/i, "").split(",")[1]
            shadow
            .attr("x", 0)
            .attr("y", startTick)
            .attr("width", tick_size)
            .attr("height", endTick - startTick)
            .attr("fill", "black")
            .attr("fill-opacity", "0.25")
            
 
       } 
    }

    
          
}




</script>
<template>
<svg  viewBox="0 0 800 50" class="timeaxes" overflow="visible">

</svg>
</template>

