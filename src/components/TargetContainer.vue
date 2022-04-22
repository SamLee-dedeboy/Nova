<script>
import Target from "./Target.vue";

export default ({
    components: {
      Target
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
    }
})
</script>

<template>
<div>
    <Target v-for="(graph,index) in filtered_dataset" 
    :key="graph.center_node"
    :graph="graph"
    :graph_index="index"
    :id="`graph-${index}`">
    </Target>
</div>
</template>