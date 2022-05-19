<script>
import Graph from "./Graph.vue";
import Cloud from "./Cloud.vue"
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Legend from './Legend.vue'
import TimeAxes from './TimeAxes.vue'
export default ({
    components: {
      Graph,
      Cloud,
      TabView,
      TabPanel,
      Legend,
      TimeAxes

    },
    props:['dataset', 'enabled_outlet_set','targets', 'topic', 'selectedTimeRange'],

    computed: {
        graph_dict: function() {
            var graph_dict = {}
            var clone_dataset = JSON.parse(JSON.stringify(this.dataset.graphList));
            clone_dataset.forEach(graph => {
                const center_node = graph.nodes.filter(node => node.isCenter)[0]
                graph_dict[center_node.text] = graph
            })
            Object.keys(graph_dict).forEach(key => {
                graph_dict[key].nodes =  graph_dict[key].nodes.filter(node => node.text||(this.enabled_outlet_set.includes(node.outlet)))
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
    <TabPanel v-for="(target, index) in targets" :key="target" :header="topic">
            <Graph  
            :graph="graph_dict[target]"
            :graph_index="index"
            :id="`graph-${index}`"
            @node-clicked="handleNodeClicked"
            >
        </Graph >
        <!-- <Legend v-if="targets.length!=0"></Legend> -->
        <TimeAxes v-if="targets.length!=0" :selectedTimeRange="selectedTimeRange"></TimeAxes>

    </TabPanel>
</TabView>
</template>