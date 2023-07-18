<script setup lang="ts">
import * as d3 from "d3";
import * as vue from "vue"
import { Legend } from "./Legend";

const props = defineProps({
    id: String,
    color_dict: Object as () => {[id: string]: string},
    row_height: Number,
    font_size: Number,
})
const margin = {top: 15, bottom: 20, left:15,  right: 15, vertical: 10}
// const len = Object.keys(props.color_dict!).length
const row_height = vue.computed(() => props.row_height? props.row_height : 15)
const row_width = 200 - margin.left - margin.right
const font_size = vue.computed(() => props.font_size? props.font_size : 1)
// const viewBox: [number, number] = [150, margin.top + margin.bottom + len*(margin.vertical + row_height.value)]
const viewBox: [number, number] = [200, 200]
const legend = new Legend(
    props,
    props.id!,
    margin,
    viewBox,
    row_height.value,
    row_width,
    font_size.value,
)
vue.onMounted(()=> {
    legend.draw()
})

vue.watch(() => props.color_dict, () => {
    legend.draw()
})

</script>

<template>
    <div class="legend-container">
        <svg  class="legend-svg" viewBox="-5 0 200 200" :id="id"></svg>
    </div>
</template>

<style scoped>
.legend-container {
    /* width: 85%; */
}
.legend-svg {
    width: 100%;
    height: 100%;
}
</style>