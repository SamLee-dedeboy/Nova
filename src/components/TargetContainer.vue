<script>
import Graph from "./Graph.vue";
import Cloud from "./Cloud.vue"
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
export default ({
    components: {
      Graph,
      Cloud,
      TabView,
      TabPanel
    },
    props:['dataset', 'enabled_outlet_set','targets'],
    data() {
        return {
            filtered_dataset: [],
            changed:0,
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
<TabView>
    <TabPanel v-for="target in targets" :key="target" :header="target">
            <Graph v-for="(graph,index) in filtered_dataset" 
            :key="graph.center_node"
            :graph="graph"
            :graph_index="index"
            :id="`graph-${index}`"
            @node-clicked="handleNodeClicked">
        </Graph >
    </TabPanel>
</TabView>
</template>