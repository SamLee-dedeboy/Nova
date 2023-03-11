<script>
import Slider from "primevue/slider"
export default {
    components: {
        Slider,
    },
    emits:['update:opacityThreshold'],
    props:['opacityThreshold'],
    methods: {
        handleChange() {
            this.$emit("update:opacityThreshold", this.opacityThreshold)
        }
    }
}
</script>

<template>
    <div class="opacity-slider-container">
        <div class="range-indicator">{{opacityThreshold}}</div>
        <Slider v-model="opacityThreshold" :step="0.1" :min="0" :max="1"
        orientation="vertical"
        @change="handleChange"></Slider>
        <div class="slider-header">Opacity Threshold</div>
    </div>

</template>
<style scoped lang="scss">
.opacity-slider-container {
    text-align: center;
}
.p-slider {
    display: inline-block !important;
    vertical-align: top !important;
}
.slider-header {
    margin-top: 8px;
    display: inline-block;
    vertical-align: top;
}
.range-indicator {
    margin-bottom: 5px;
    display: block;
}
:deep(.p-slider-handle) {
    border-radius: 10px !important; 
}
</style>