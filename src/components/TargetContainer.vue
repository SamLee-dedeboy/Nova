<script>
import Graph from "./Graph.vue";
import Cloud from "./Cloud.vue"
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import TimeAxes from './TimeAxes.vue'
import * as dfd from "danfojs"
import Dropdown from 'primevue/dropdown';
import InfoButton from "./InfoButton.vue";


export default ({
    components: {
      Graph,
      Cloud,
      TabView,
      TabPanel,
      TimeAxes,
      Dropdown,
      InfoButton,
    },
    props:['articles', 'enabled_outlet_set','targets', 'topic', 'selectedTimeRange'],
    data() {
        return {
            entity_graph: {
                nodes:[]
            },
            cooccur_matrix: {},
            clicked_outlet: undefined,
            opacityThreshold: 0,
            modes: [
                {label: "avg_score", value: "avg_score"},
                {label: "score", value: "score"},
                {label: "#articles", value: "#articles"}],
            selected_mode: "score",
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
            return this.constructOutletGraph()
        }
    },

    methods: {
        constructOutletGraph() {
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
                var center_node = self.construct_node(self.articles, target)
                center_node["isCenter"] = true
                graph.nodes.push(center_node)
                graph_dict[target] = graph
            })
            return graph_dict

        },
        idsToArticles(article_ids) {
            if(!article_ids) return []
            var self = this
            return article_ids.reduce(function(article_list, id) { article_list.push(self.article_dict[id]); return article_list; }, [])
        },
        handleNodeClicked(clicked_node) {
            this.$emit("node-clicked", clicked_node)        
            this.nodeClicked = true
            const target = this.targets[0]
            const articles = clicked_node.articles
            const max_node_num = 10
            // generate candidates that cooccur frequently with target
            let entity_mentioned_articles = {}
            articles.forEach(article => {
                const entity_list = article.entities
                entity_list.forEach(entity_mention => {
                    const entity_id = entity_mention[3]
                    entity_mentioned_articles[entity_id] = (entity_mentioned_articles[entity_id] || new Set())
                    entity_mentioned_articles[entity_id].add(article.id)
                })
            })
            // get top k candidates
            var freq_list = Array.from(Object.entries(entity_mentioned_articles).map(item => [item[0], item[1].size])).sort((a,b) => (b[1] - a[1])).slice(0, max_node_num).map(item => item[0]) 
            var cooccur_matrix = {}

            var nodes = []
            freq_list.forEach(entity_id => {
                // generate candidate cooccur matrix
                cooccur_matrix[entity_id] = {}
                const entity_articles = this.idsToArticles([...entity_mentioned_articles[entity_id]])
                entity_articles.forEach(article => {
                    const comentioned_entities = Array.from(new Set(article.entities.map(mention => mention[3]).filter(entity => freq_list.includes(entity))))
                    comentioned_entities.forEach(cooccur_entity_id => {
                        // if(entity_id != cooccur_entity_id)
                        cooccur_matrix[entity_id][cooccur_entity_id] = (cooccur_matrix[entity_id][cooccur_entity_id] || 0)+1  
                    })
                })
                // construct node
                const node = this.construct_node(entity_articles, entity_id)
                nodes.push(node)
            })
            this.entity_graph.nodes = nodes
            this.cooccur_matrix = cooccur_matrix
            this.clicked_outlet = clicked_node.text
        },
        construct_node(articles, label) {
            let node = {}
            if(articles.length == 0) {
                node = {
                    text: label,
                    sentiment: 0,
                    dotted: true,
                }
            } else {
                // const pos_sst = articles.map(article => article.sentiment.pos).reduce((sum, cur) => sum + cur, 0)
                // const neg_sst = articles.map(article => article.sentiment.neg).reduce((sum, cur) => sum + cur, 0)
                // const neu_sst = 0
                const sst_df = new dfd.DataFrame(articles.map(article=>article.sentiment))
                const neu_threshold = 0.2
                // const pos_sst = sst_df.iloc({rows: sst_df["normalized_sst"].gt(neu_threshold)}).count({axis:0}).at("normalized_sst",1) || 0
                // const neg_sst = sst_df.iloc({rows: sst_df["normalized_sst"].lt(-neu_threshold)}).count({axis:0}).at("normalized_sst",1) || 0
                // const neu_sst = sst_df.iloc({rows: sst_df["normalized_sst"].lt(neu_threshold).and(sst_df["normalized_sst"].gt(-neu_threshold))}).count({axis:0}).at("normalized_sst",1) || 0
                const pos_dfs = sst_df.iloc({rows: sst_df["normalized_sst"].gt(neu_threshold)})
                const neg_dfs = sst_df.iloc({rows: sst_df["normalized_sst"].lt(-neu_threshold)})
                const neu_pos_dfs = sst_df.iloc({rows: sst_df["normalized_sst"].lt(neu_threshold).and((sst_df["normalized_sst"].gt(0)))})
                const neu_neg_dfs = sst_df.iloc({rows: (sst_df["normalized_sst"].lt(0).or(sst_df["normalized_sst"].eq(0))).and(sst_df["normalized_sst"].gt(-neu_threshold))})

                const pos_sst = pos_dfs.sum({axis:0}).at("normalized_sst",1) || 0
                const neg_sst = neg_dfs.sum({axis:0}).at("normalized_sst",1) || 0
                const neu_pos_sst = neu_pos_dfs.sum({axis:0}).at("normalized_sst",1) || 0
                const neu_neg_sst = neu_neg_dfs.sum({axis:0}).at("normalized_sst",1) || 0
                // const neu_pos_sst = (1/neu_threshold)*neu_pos_dfs.sum({axis:0}).at("normalized_sst",1) || 0
                // const neu_neg_sst = (1/neu_threshold)*neu_neg_dfs.sum({axis:0}).at("normalized_sst",1) || 0
                const neu_sst = Math.abs(neu_neg_sst) + neu_pos_sst 


                const pos_atcs = pos_dfs.count({axis:0}).at("normalized_sst", 1) || 0
                const neg_atcs = neg_dfs.count({axis:0}).at("normalized_sst", 1) || 0
                const neu_pos_atcs = neu_pos_dfs.count({axis:0}).at("normalized_sst", 1) || 0
                const neu_neg_atcs = neu_neg_dfs.count({axis:0}).at("normalized_sst", 1) || 0
                const neu_atcs = neu_pos_atcs + neu_neg_atcs
                // const pos_sst = sst_df.iloc({rows: sst_df["normalized_sst"].gt(neu_threshold)}).at("normalized_sst",1) || 0
                // const neg_sst = sst_df.iloc({rows: sst_df["normalized_sst"].lt(-neu_threshold)}).at("normalized_sst",1) || 0
                // const neu_sst = sst_df.iloc({rows: sst_df["normalized_sst"].lt(neu_threshold).and(sst_df["normalized_sst"].gt(-neu_threshold))}).at("normalized_sst",1) || 0
                let sst_array;
                let sentiment;
                const classes = ["pos", "neg", "neu"]
                if(this.selected_mode === "avg_score") {
                    sst_array = [pos_sst/pos_atcs, Math.abs(neg_sst)/neg_atcs, Math.abs(neu_sst)/neu_atcs]
                    sentiment = classes[sst_array.indexOf(Math.max(...sst_array))]
                } else if (this.selected_mode === "score") {
                    sst_array = [pos_sst, Math.abs(neg_sst), Math.abs(neu_sst)]
                    sentiment = classes[sst_array.indexOf(Math.max(...sst_array))]
                } else if(this.selected_mode === "#articles") {
                    sst_array = [pos_atcs, neg_atcs, neu_atcs]
                    sentiment = classes[sst_array.indexOf(Math.max(...sst_array))]
                }
                node = {
                    text: label,
                    sentiment: sentiment, 
                    pos_articles: pos_atcs,
                    neg_articles: neg_atcs,
                    neu_articles: neu_atcs,
                    pos_sent: pos_sst,
                    neg_sent: neg_sst,
                    neu_sent: neu_sst,
                    neu_pos_sent: neu_pos_sst,
                    neu_neg_sent: neu_neg_sst,
                    articles: articles,
                    dotted: false 
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
    <TabPanel v-for="(target, index) in targets" :key="target" :header="targets[0]" >
        <Graph 
            class="graph"
            :graph="graph_dict[target]"
            :graph_index="index"
            :id="`graph-${index}`"
            :entity_graph="entity_graph.nodes"
            :cooccur_matrix="cooccur_matrix"
            :opacityThreshold="opacityThreshold"
            @node-clicked="handleNodeClicked"
            >
        </Graph >
        <TimeAxes class='time-axes' v-if="targets.length!=0" :selectedTimeRange="selectedTimeRange"></TimeAxes>
        <div class="dropdown-container">
            <div class="dropdown-header-container">
                <div class="dropdown-header"> Classifier </div>
                <InfoButton class='clf-info' info_content="Choose a mode to classify nodes as 'pos'/'neg'/'neu'"></InfoButton>
            </div>
            <Dropdown class="clf-dropdown" 
            v-model="selected_mode" 
            :options="modes" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Select a clfer" />
        </div>
    </TabPanel>
</TabView>
</template>

<style scoped>
.dropdown-container {
    position: absolute;
    left: 88.2%;
    top: 15%;
}
.dropdown-header-container {
    display: flex;
}
.dropdown-header {
    display: flex;
    align-items: center;
    justify-content: center;
}
:deep(.tooltip) {
    position:absolute;
    left:-100px; 
    top:-75px;
}
.graph {
    /* height: 600px; */
}
.time-axes {
    position:absolute;
    top:23%;
    left:2%;
}
</style>