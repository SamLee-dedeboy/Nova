<script setup lang="ts">
import * as vue from "vue"
import Slider from "primevue/slider"
import InputText from "primevue/inputtext";
import * as SstColors from "./utils/ColorUtils"
import ColorSpectrum from "./ColorSpectrum.vue";
const props = defineProps({
    article_num_threshold: Number,
    max_articles: Number,
    min_articles: Number,
})

const emit = defineEmits(["update:article_num_threshold"])

// vue.watch(() => props.article_num_threshold, (new_value, old_value) => {
//     emit("update:article_num_threshold", props.article_num_threshold)
// })
function handleIncrement() {
    const tmp = Math.min(+props.article_num_threshold!+10, props.max_articles||100)
    emit("update:article_num_threshold", tmp)
}

function handleDecrease() {
    const tmp = Math.max(+props.article_num_threshold!-10, 0)
    emit("update:article_num_threshold", tmp)
}

function updateThreshold(e) {
  emit("update:article_num_threshold", Math.round(e))
}
</script>
<template>
    <div class="threshold-input-container">
        <InputText class="threshold-input" v-model="props.article_num_threshold"></InputText>
        <Button class="increment-button p-button-secondary"  @click="handleIncrement"> <i class="pi pi-angle-up" style="font-size: 0.75rem"></i></Button>
        <Button class="decrement-button p-button-secondary " @click="handleDecrease"> <i class="pi pi-angle-down" style="font-size: 0.75rem"></i></Button>
    </div>
    <div class="threshold-slider-container">
        <div class="slider-spectrum-container">
            <Slider class="threshold-slider" 
            :modelValue="props.article_num_threshold" 
            @change="updateThreshold"
            :step="10" 
            :min="props.min_articles" 
            :max="props.max_articles"></Slider>
            <ColorSpectrum class="color-spectrum" :color-scale="SstColors.article_num_color_scale"></ColorSpectrum>
        </div>
        <div class="indicator-container">
            <div class="min_indicator">{{props.min_articles}}</div>
            <div class="max_indicator">{{props.max_articles}}</div>
        </div>
    </div>
</template>

<style scoped>
.increment-button{
  margin: 1%;
}

.decrement-button{
  margin: 1%;
}

.threshold-input-container {
  display: flex;
  /* width: 50%; */
  height: 20%;
  /* margin: 2%; */
}
.threshold-input {
  width: 100%;
  text-align: right;
}
.color-spectrum {
  height: 25px;
  width: 100%;
  overflow: hidden;
}
.indicator-container {
  display: flex;
  justify-content: space-between;
}
.slider-spectrum-container {
  display: flex;
  align-items: center;
}
.threshold-slider {
    position: absolute;
    width: 100%;
    height: 0.1rem !important;
}
.threshold-slider-container {
  /* width: 50%; */
  /* margin: 2%; */
}
:deep(.p-button) {
  justify-content: center;
}
:deep(.p-slider-handle) {
    border-radius: 10px !important; 
    background: white !important;
    z-index: 2;
    height: 1.3rem !important;
    width: 0.4rem !important;
    border: 2px solid black !important;
    /* left: unset !important; */
}
:deep(.p-slider.p-slider-horizontal .p-slider-handle) {
  margin-left: unset !important;
}
:deep(.p-slider-handle:hover) {
    background: #007bff !important;
} 
</style>