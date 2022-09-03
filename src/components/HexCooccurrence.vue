<script setup lang="ts">
import * as vue from "vue"
import * as d3 from "d3"
import { updateOverviewGrid } from "./TutorialUtils";
import * as SstColors from "./ColorUtils"
import { stringify } from "querystring";
import { EntityCooccurrences } from "../types"


const viewBox = [1000, 1000]
const margin = {top: 60, bottom: 60, right:40, left: 80} 
const viewBox_width = viewBox[0] - margin.left - margin.right
const viewBox_height = viewBox[1] - margin.top - margin.bottom
const props = defineProps({
    id: String,
    entity_cooccurrences: Object as () => EntityCooccurrences
})

vue.onMounted(() => {
    console.log(props.entity_cooccurrences)
    const svg = d3.select(`#${props.id}`).select("svg")
        .attr("viewBox", `0 0 ${viewBox[0]} ${viewBox[1]}`)
    
})
</script>

<template>
    <div class="hex-container">
        <svg :id="id"></svg>
    </div>
</template>

<style scoped>

</style>
