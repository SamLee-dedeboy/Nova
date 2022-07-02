<script>
import Slider from "primevue/slider"
import TimeAxes from "./TimeAxes.vue"
import * as d3 from "d3"
export default {
    emits:['update:selectedRange'],
    props: ["selectedRange"],
    components: {
        Slider,
        TimeAxes
    },
    // data() {
    //     return {
    //         timeRange: [1, 13]
    //     }
    // },
    mounted() {
        let scale = d3.scaleLinear().domain([1, 13]).range([0, 200]);
        let axis = d3.axisBottom(scale);
        let monthAxis = d3.select("svg.slideraxes").call(axis); 
        let lastTick = monthAxis.select(":nth-child(14) text").text(1)
    },
    methods: {
        handleChange() {
            this.$emit("update:selectedRange", this.selectedRange) 
        }
    }
}

</script>
<template>
    <div class="month-slider-container">
        <div class="slider-header">Date Range</div>
        <Slider v-model="selectedRange" :range="true" :step="1" :min="1" :max="13"
        @change="handleChange"></Slider>
        <svg  viewBox="0 0 200 30" class="slideraxes" overflow="visible" style="position:absolute;left:20px;right:20px"></svg>
    </div>
</template>
<style scoped lang="scss">
.p-slider-horizontal {
    margin-top: 20px;
    margin-left: 20px;
    margin-right: 20px;
}
:deep(.p-slider-handle){
    border-radius: 10px !important;
}
svg {
    margin-top: 9px;
}
.month-slider-container {
    border-style: solid;
    border-radius: 6px;
    border-width: 2px;
    border-color: ghostwhite;
    margin:5px;
}
.slider-header {
    background: #efefef;
    color: #212529;
    border: solid #dee2e6;
    border-top-width: medium;
    border-right-width: medium;
    border-bottom-width: medium;
    border-left-width: medium;
    border-width: 1px 0 0 0;
    padding: 0.5rem 0.5rem;
   /* margin-left:20px;  */
}
</style>