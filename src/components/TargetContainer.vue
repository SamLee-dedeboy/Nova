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

    computed: {
        graph_dict: function() {
            var graph_dict = {}
            var clone_dataset = JSON.parse(JSON.stringify(this.dataset.graphList));
            clone_dataset.forEach(graph => {
                graph_dict[graph.center_node.text] = graph
            })
            Object.keys(graph_dict).forEach(key => {
                graph_dict[key].nodes =  graph_dict[key].nodes.filter(node => this.enabled_outlet_set.includes(node.outlet))
            });
            return graph_dict
        }
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
    <TabPanel v-for="(target, index) in targets" :key="target" :header="target">
            <Graph  
            :graph="graph_dict[target]"
            :graph_index="index"
            :id="`graph-${index}`"
            @node-clicked="handleNodeClicked"
            >
        </Graph >
    </TabPanel>
</TabView>
</template>