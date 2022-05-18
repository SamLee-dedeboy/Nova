<script>
import Slider from "primevue/slider"
import TimeAxes from "./TimeAxes.vue"
import * as d3 from "d3"
export default {
    components: {
        Slider,
        TimeAxes
    },
    data() {
        return {
            value: [1, 12]
        }
    },
    mounted() {
        let scale = d3.scaleLinear().domain([1, 12]).range([0, 200]);
        let axis = d3.axisBottom(scale);
        d3.select("svg.slideraxes").call(axis); 

    }
}

</script>
<template>
    <span class="slider-header">Date Range</span>
    <Slider v-model="value" :range="true" :step="1" :min="1" :max="12"></Slider>
    <svg  viewBox="0 0 200 30" class="slideraxes" overflow="visible" style="position:absolute;left:20px;right:20px"></svg>
</template>
<style>
.p-slider-horizontal {
    margin-top: 20px;
    margin-left: 20px;
    margin-right: 20px;
}
.p-slider .p-slider-handle{
    border-radius: 10px !important;
}
svg {
    margin-top: 9px;
}
span.slider-header {
   margin-left:20px; 
}
</style>