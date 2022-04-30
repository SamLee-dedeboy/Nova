<script>
import Graph from "./Graph.vue";
import Cloud from "./Cloud.vue"
export default ({
    components: {
      Graph,
      Cloud
    },
    props:['dataset', 'enabled_outlet_set'],
    data() {
        return {
            filtered_dataset: [],
            changed:0
        }
    },
    watch: {
        enabled_outlet_set: function() {
            // deep copy
            this.filtered_dataset = JSON.parse(JSON.stringify(this.dataset.graphList));
            this.filtered_dataset.forEach(graph => {
                graph.nodes =  graph.nodes.filter(node => this.enabled_outlet_set.includes(node.outlet))
            });
        },
    },
    methods: {
        handleNodeClicked(clicked_node) {
            this.$emit("node-clicked", clicked_node)        
        }
    }
})
</script>

<template>
<div>
    <Graph v-for="(graph,index) in filtered_dataset" 
    :key="graph.center_node"
    :graph="graph"
    :graph_index="index"
    :id="`graph-${index}`"
    @node-clicked="handleNodeClicked">
    </Graph >
</div>
</template>