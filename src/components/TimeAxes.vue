<script>
import * as d3 from "d3";

export default {
    mounted() {
        let scale = d3.scaleLinear().domain([1, 12]).range([10, 780]);
        let axis = d3.axisBottom(scale);
        d3.select('svg.timeaxes').call(axis); 
    },

    
          
}




</script>
<template>
<svg  viewBox="0 0 800 50" class="timeaxes" style="position:absolute;top:99%;left:0%">

</svg>
</template>

