<script>
import Graph from "./Graph.vue";
import Cloud from "./Cloud.vue"
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Legend from './Legend.vue'
import TimeAxes from './TimeAxes.vue'
import * as dfd from "danfojs"
export default ({
    components: {
      Graph,
      Cloud,
      TabView,
      TabPanel,
      Legend,
      TimeAxes

    },
    props:['outlet_article_dict', 'enabled_outlet_set','targets', 'topic', 'selectedTimeRange'],
    computed: {
        graph_dict: function() {
            var graph_dict = {}
            this.targets.forEach(target => {
                let graph = {
                    nodes: [],
                } 
                this.enabled_outlet_set.forEach(outlet => {
                    const articles = this.outlet_article_dict[outlet]
                    if(articles.length == 0) {
                        let node = {
                            outlet: outlet,
                            sentiment: 0,
                            dotted: true
                        }
                        graph.nodes.push(node)
                    } else {
                        // const pos_sst = articles.map(article => article.sentiment.pos).reduce((sum, cur) => sum + cur, 0)
                        // const neg_sst = articles.map(article => article.sentiment.neg).reduce((sum, cur) => sum + cur, 0)
                        // const neu_sst = 0
                        const sst_df = new dfd.DataFrame(articles.map(article=>article.sentiment))
                        const neu_threshold = 0.1
                        const pos_sst = sst_df.iloc({rows: sst_df["normalized_sst"].gt(neu_threshold)}).count({axis:0}).at("normalized_sst",1) 
                        const neg_sst = sst_df.iloc({rows: sst_df["normalized_sst"].lt(-neu_threshold)}).count({axis:0}).at("normalized_sst",1) 
                        const neu_sst = sst_df.iloc({rows: sst_df["normalized_sst"].lt(neu_threshold).and(sst_df["normalized_sst"].gt(-neu_threshold))}).count({axis:0}).at("normalized_sst",1) 
                        let node = {
                            outlet: outlet,
                            sentiment: pos_sst + neg_sst + neu_sst,
                            pos_sent: pos_sst,
                            neg_sent: neg_sst,
                            neu_sent: neu_sst,
                            articles: articles 
                        }
                        graph.nodes.push(node)
                    }
                }) 
                // center node
                graph.nodes.push({
                    text: target,
                    pos_sent: 0,
                    neg_sent: 0,
                    neu_sent: 0,
                    isCenter: true
                })
                graph_dict[target] = graph
            })
            // var clone_dataset = JSON.parse(JSON.stringify(this.dataset.graphList));
            // clone_dataset.forEach(graph => {
            //     const center_node = graph.nodes.filter(node => node.isCenter)[0]
            //     graph_dict[center_node.text] = graph
            // })
            // Object.keys(graph_dict).forEach(key => {
            //     graph_dict[key].nodes =  graph_dict[key].nodes.filter(node => node.text||(this.enabled_outlet_set.includes(node.outlet)))
            // });
            return graph_dict
        }
    },

    methods: {
        handleNodeClicked(clicked_node) {
            this.$emit("node-clicked", clicked_node)        
        },
        normalization(x, mean, std) {
            return Math.tanh((x-mean)/std)
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