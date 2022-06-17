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
    props:['articles', 'enabled_outlet_set','targets', 'topic', 'selectedTimeRange'],
    data() {
        return {
            entity_graph: {
                nodes:[]
            },
            cooccur_matrix: {}
        }
    },
    computed: {
        outlet_article_dict: function() {
            var outlet_article_dict = {} 
            this.articles.forEach(article => {
                outlet_article_dict[article.journal] = outlet_article_dict[article.journal] || []
                outlet_article_dict[article.journal].push(article.id)
            })
            return outlet_article_dict
        },
        article_dict: function() {
            return this.articles.reduce((dict, article) => (dict[article.id]=article, dict), {})
        },
        graph_dict: function() {
            var graph_dict = {}
            var graph = {
                nodes: []
            }
            var self = this
            this.targets.forEach(target => {
                this.enabled_outlet_set.forEach(outlet => {
                    const article_ids = this.outlet_article_dict[outlet]
                    const articles = this.idsToArticles(article_ids)
                    const node = self.construct_node(articles, outlet) 
                    graph.nodes.push(node)
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
        idsToArticles(article_ids) {
            var self = this
            return article_ids.reduce(function(article_list, id) { article_list.push(self.article_dict[id]); return article_list; }, [])
        },
        handleNodeClicked(clicked_node) {
            this.$emit("node-clicked", clicked_node)        
            const target = this.targets[0]
            const articles = clicked_node.articles
            const max_node_num = 15 
            // generate candidates that cooccur frequently with target
            let cooccur_freq = {}
            articles.forEach(article => {
                const entity_list = article.entities
                entity_list.forEach(entity_mention => {
                    const entity_id = entity_mention[3]
                    cooccur_freq[entity_id] = (cooccur_freq[entity_id] || [])
                    cooccur_freq[entity_id].push(article.id)
                })
            })
            // get top k candidates
            const freq_list = Object.entries(cooccur_freq).map(item => [item[0], item[1].length]).sort((a,b) => (a[1] < b[1])).slice(0, max_node_num).map(item => item[0])

            var cooccur_matrix = {}
            var nodes = []
            freq_list.forEach(entity_id => {
                // generate candidate cooccur matrix
                cooccur_matrix[entity_id] = {}
                const entity_articles = this.idsToArticles(cooccur_freq[entity_id])
                entity_articles.forEach(article => {
                    const mentioned_entities = article.entities.map(mention => mention[3]).filter(entity => freq_list.includes(entity))
                    mentioned_entities.forEach(cooccur_entity_id => {
                        cooccur_matrix[entity_id][cooccur_entity_id] = (cooccur_matrix[entity_id][cooccur_entity_id] || 0)+1  
                    })
                })
                // construct node
                const node = this.construct_node(entity_articles, entity_id)
                nodes.push(node)
            })
            this.entity_graph.nodes = nodes
            this.cooccur_matrix = cooccur_matrix
            // // var nodes = [] 
            // // for (const [entity_id, article_ids] of Object.entries(cooccur_freq)) {
            // //     const articles = this.idsToArticles(article_ids) 
            // //     const node = this.construct_node(articles, entity_id) 
            // //     nodes.push(node)
            // // }
            // this.entity_graph.nodes = nodes.sort((a,b) => (a.articles.length < b.articles.length)).slice(0, max_node_num)

        },
        construct_node(articles, label) {
            let node
            if(articles.length == 0) {
                node = {
                    text: label,
                    sentiment: 0,
                    dotted: true
                }
            } else {
                // const pos_sst = articles.map(article => article.sentiment.pos).reduce((sum, cur) => sum + cur, 0)
                // const neg_sst = articles.map(article => article.sentiment.neg).reduce((sum, cur) => sum + cur, 0)
                // const neu_sst = 0
                const sst_df = new dfd.DataFrame(articles.map(article=>article.sentiment))
                const neu_threshold = 0.05
                const pos_sst = sst_df.iloc({rows: sst_df["normalized_sst"].gt(neu_threshold)}).count({axis:0}).at("normalized_sst",1) || 0
                const neg_sst = sst_df.iloc({rows: sst_df["normalized_sst"].lt(-neu_threshold)}).count({axis:0}).at("normalized_sst",1) || 0
                const neu_sst = sst_df.iloc({rows: sst_df["normalized_sst"].lt(neu_threshold).and(sst_df["normalized_sst"].gt(-neu_threshold))}).count({axis:0}).at("normalized_sst",1) || 0
                const sst_array = [pos_sst, neg_sst, neu_sst]
                node = {
                    text: label,
                    sentiment: ["pos", "neg", "neu"][sst_array.indexOf(Math.max(...sst_array))],
                    pos_sent: pos_sst,
                    neg_sent: neg_sst,
                    neu_sent: neu_sst,
                    articles: articles 
                }
            }
            return node
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
            :entity_graph="entity_graph.nodes"
            :cooccur_matrix="cooccur_matrix"
            @node-clicked="handleNodeClicked"
            >
        </Graph >
        <!-- <Legend v-if="targets.length!=0"></Legend> -->
        <TimeAxes v-if="targets.length!=0" :selectedTimeRange="selectedTimeRange"></TimeAxes>

    </TabPanel>
</TabView>
</template>