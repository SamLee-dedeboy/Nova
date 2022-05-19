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
        let scale = d3.scaleLinear().domain([1, 13]).range([10, 780]);
        let axisGenerator = d3.axisBottom(scale)
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
            const tick_size = 50
            let monthAxis = d3.select('svg.timeaxes g')
            monthAxis.selectAll("g.tick line")
                .attr("y2", (d) => (d>=this.selectedTimeRange[0]&&d<=this.selectedTimeRange[1])?-tick_size:6);
            let shadow = d3.select("svg.timeaxes rect.shadow")
            let startTick = monthAxis.select(":nth-child(" + (this.selectedTimeRange[0]+2)+ ")").attr("transform").replace(/translate\(/i, "").replace(/\)/i, "").split(",")[0]
            let endTick = monthAxis.select(":nth-child(" + (this.selectedTimeRange[1]+2)+ ")").attr("transform").replace(/translate\(/i, "").replace(/\)/i, "").split(",")[0]
            shadow.attr("x", startTick)
            .attr("y", -tick_size)
            .attr("width", endTick - startTick)
            .attr("height", tick_size)
            .attr("fill", "black")
            .attr("fill-opacity", "0.25")
            
 
       } 
    }

    
          
}




</script>
<template>
<svg  viewBox="0 0 800 50" class="timeaxes" overflow="visible" style="position:absolute;top:99%;left:0%">

</svg>
</template>

