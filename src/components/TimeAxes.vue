<script>
import * as d3 from "d3";

export default {
    props:["selectedTimeRange"],
    mounted() {
        let scale = d3.scaleLinear().domain([1, 12]).range([10, 780]);
        let axisGenerator = d3.axisBottom(scale)
        let monthAxis = d3.select('svg.timeaxes').append("g")
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
            let monthAxis = d3.select('svg.timeaxes g')
            monthAxis.selectAll("g.tick line")
                .attr("y2", (d) => (d>=this.selectedTimeRange[0]&&d<=this.selectedTimeRange[1])?-200:6);
    
       } 
    }

    
          
}




</script>
<template>
<svg  viewBox="0 0 800 50" class="timeaxes" overflow="visible" style="position:absolute;top:99%;left:0%">

</svg>
</template>

