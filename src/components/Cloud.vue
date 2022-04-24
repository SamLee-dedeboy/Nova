<script>
import { defineComponent } from '@vue/composition-api'
import * as d3 from "d3";

export default defineComponent({
    setup() {
    },
    props: ['graph', 'graph_index'],
    mounted() {
        this.canvas = d3.select("#graph-" + this.graph_index)
        this.canvas.append("svg")

        this.color_neg = d3.scaleSqrt()
            .domain([-1, 0])  
            .range(["red", "white"]); 
        this.color_pos = d3.scaleSqrt()
            .domain([0, 1])
            .range(["white", "yellow"]);
        this.updateGraph()
    },
    methods: {
        updateGraph() {

        }
    }
})
</script>
<template>
    <span >
    </span>
</template>