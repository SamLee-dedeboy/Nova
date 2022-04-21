<script>
import Target from "./Target.vue";

export default ({
    components: {
      Target
    },
    props:['dataset', 'enabled_outlet_set'],
    data() {
        return {
            filtered_dataset: {
                graphList:[],
                outlet_set:[]
            },
            enabled_outlet_set: []
        }
    },
    watch: {
        dataset: function() {
            console.log("TargetContainer: get dataset", this.dataset)
        },
        enabled_outlet_set: function() {
            console.log("TargetContainer: get filtering", this.enabled_outlet_set)
            this.filtered_dataset = this.dataset
            this.filtered_dataset.graphList.forEach(graph => {
                graph.nodes =  graph.nodes.filter(node => this.enabled_outlet_set.filter(outlet => outlet.enabled).map(outlet => outlet.outlet).includes(node.outlet))
            });
            console.log("TargetContainer: filtered.", this.filtered_dataset)
        }
    }
})
</script>

<template>
<div>
    <Target v-for="(graph,index) in dataset.graphList" 
    :key="graph.center_node"
    v-bind:graph="graph"
    :graph_index="index"
    :id="`graph-${index}`">
    </Target>
</div>
</template>