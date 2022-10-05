<script setup lang="ts">
import * as d3 from "d3";
import * as SstColors from "./utils/ColorUtils"
import * as vue from "vue"
import { Legend } from "./Legend";

const props = defineProps({
    id: String,
    color_dict: Object as () => {[id: string]: string},
    filter: Boolean,
    interactable: Boolean,
})

const margin = {top: 25, bottom: 10, left: 15, right: 15, vertical: 15}
const len = Object.keys(props.color_dict!).length
const row_height = 5 
const viewBox: [number, number] = [150, margin.top + margin.bottom + len*(margin.vertical + row_height)]
const legend = new Legend(
    props,
    props.id!,
    margin,
    viewBox,
    row_height,
)
vue.onMounted(()=> {
    legend.draw()
})

</script>

<template>
    <div class="legend-container">
        <svg  class="legend-svg" viewBox="0 0 125 125" :id="id"></svg>
    </div>
</template>

<style scoped>
.legend-container {
    width: 100%;
    height: 100%;
    /* background-color: #eee3cd;
    border: solid;
    border-width: 2px;
    border-radius: 5px; */
    /* padding: 5px; */
    /* pointer-events: none; */
    transform-origin: top left;
}
.legend-svg {
    width: 100%;
    height: 100%;
}
</style>