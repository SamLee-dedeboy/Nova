<script>

import Filter from "../components/Filter.vue";
//import Target from "../components/Target.vue";
import TargetContainer from "../components/TargetContainer.vue";
import MyToolbar from "../components/MyToolbar.vue"
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import ArticleView from "../components/ArticleView.vue";
import TopicSelection from "../components/TopicSelection.vue";
import TargetSelection from "../components/TargetSelection.vue"
import MonthSlider from "../components/MonthSlider.vue"
import OutletScatter from "../components/OutletScatter.vue";
import * as preprocess from "../components/preprocessUtils.ts"
export default {
  components: {
    Filter,
    MyToolbar,
    Splitter,
    SplitterPanel,
    TargetContainer,
    ArticleView,
    TopicSelection,
    TargetSelection,
    MonthSlider,
    OutletScatter,
},
  data() {
    return {
      original_dataset: {
        graphList:[],
        outlet_set:[],
        np_list:[]
      },
      dataset: {
        graphList:[],
        outlet_set:[],
        np_list:[]
      },
      outlet_set: [],
      enabled_outlet_set:[],
      selected_articles: [],
      np_list:[],
      selected_target:[],
      timeRange:[1,13],
      dataset_matadata: {},
      graph_constructed: false,
      graph_dict: {},
    }
  },
  methods: {
    updateNpList(np_list) {
      // this.dataset = dataset
      // this.outlet_set = dataset.outlet_set
      // this.enabled_outlet_set = dataset.outlet_set
      // this.topic_list = Object.keys(dataset.topic_dict)
      this.np_list = np_list
      this.dataset_metadata = this.$refs.toolbar.getMetaData()  

    }, 
    processDataset(dataset) {
      this.np_list = dataset.entity_mentions
      this.dataset_metadata = dataset.metadata

      // save raw dataset 
      this.original_dataset = JSON.parse(JSON.stringify(dataset.articles))

      // get time period
      const dataset_articles = dataset.articles
      dataset_articles.sort((a1, a2) => Date.parse(a1.timestamp) > Date.parse(a2.timestamp))
      const startMonth = parseInt(dataset_articles[0].timestamp.split('-')[1])
      const endMonth = parseInt(dataset_articles[dataset_articles.length-1].timestamp.split('-')[1])
      this.timeRange = [startMonth, endMonth+1]
      let {outlet_set, normalized_articles, article_dict} = preprocess.processArticles(dataset_articles)
      this.enabled_outlet_set = outlet_set
      this.articles = normalized_articles
      this.article_dict = article_dict
      this.graph_dict = preprocess.constructOutletGraph(this.np_list, this.enabled_outlet_set, this.article_dict)
      this.graph_constructed = true
    },
    updateEnabledOutlet(outlet_set_info) {
      this.enabled_outlet_set = outlet_set_info.filter(outlet => outlet.enabled).map(outlet => outlet.outlet)
    },
    updateSelectedNode(node) {
      this.selected_articles = node.articles
    },
    updateTopic(topic) {
      this.selected_topic = topic
    },
    queryDataset(article_list) {
      console.log(article_list.toString())
      const url = "http://ec2-35-160-171-6.us-west-2.compute.amazonaws.com:8081/v1/graphql"

      const query = `
        query MyQuery {
          Article(where: {id: {_in: [${article_list}]}}) {
            id
            headline
            journal
            timestamp
            Analysis_mentioned_entities {
              mentions
            }
            Analysis_sentiments {
              sentiment
            }
            content
          }
        }
     ` 
      this.axios({
          url: url,
          method: 'post',
          data: {
            query: query,
          }
      })   
      .then(response => {
        console.log("done")
        console.log(response)
      })
    },
    updateTarget(target) {
      const index = this.entity_list.indexOf(target) 

      this.selected_target = [target]
      const article_list = this.np_list[index][1]
      // TODO: query data from graphql
      // const dataset = this.queryDataset(article_list)
      const target_articles = this.$refs.toolbar.getData(target)

      this.original_dataset = target_articles
      // sort by date and update time range
      target_articles.sort((a1, a2) => Date.parse(a1.timestamp) > Date.parse(a2.timestamp))
      const startMonth = parseInt(target_articles[0].timestamp.split('-')[1])
      const endMonth = parseInt(target_articles[target_articles.length-1].timestamp.split('-')[1])
      this.timeRange = [startMonth, endMonth+1]
      this.updateDicts(target_articles)
    },
  },
  watch: {
    timeRange: function(new_range, old_range) {
      if(new_range[0] != old_range[0] || new_range[1] != old_range[1]) {
        const startIndex = this.original_dataset.findIndex(article => parseInt(article.timestamp.split('-')[1]) >= new_range[0])
        const endIndex = this.original_dataset.findIndex(article => parseInt(article.timestamp.split('-')[1]) > new_range[1])
        const subset = this.original_dataset.slice(startIndex, (endIndex == -1? this.original_dataset.length : endIndex))
        // this.updateDicts(subset)
      }
    }
  },
  computed: {
    entity_list: function() {
      return this.np_list.map(entity_mentions => entity_mentions[0])
    },
    entity_data: function() {
      return this.np_list.map(entity_mentions => { return {"name": entity_mentions[0], "num": entity_mentions[1].length || 0}})
    }
  }
}
</script>

<template>
  <main>
    <Splitter class="splitter-outmost" layout="vertical">
      <SplitterPanel id="overview-section" class="flex align-items-center justify-content-center" :size="100">
        <Splitter>
          <SplitterPanel id='target-section' class="flex align-items-center justify-content-center" :size="55"> 
            <!-- <TargetContainer
            v-if="np_list.length!=0"
            :articles="normalized_articles"
            :enabled_outlet_set="enabled_outlet_set"
            :selected_entities="selected_entities"
            :selectedTimeRange="timeRange"
            >
            </TargetContainer> -->
          </SplitterPanel>
          <SplitterPanel id='sidebar' class="flex align-items-center justify-content-center" :size="45" :min-size="20">
            <MyToolbar ref="toolbar" 
            @candidate_updated="updateNpList"
            @dataset_imported="processDataset"  ></MyToolbar>
          <div class="entity-grid-container" v-if="graph_constructed" >
            <OutletScatter
                v-for="(entity, index) in entity_list" :key="entity" 
                class="outlet-scatter"
                :graph="graph_dict[entity]"
                :graph_index="index"
                :id="`scatter-${index}`"
                style="cursor: pointer"
                expanded="false"
                @click="handleScatterClicked(index)"
            >
            </OutletScatter>
            </div>

            <!-- <div class="selection_container" style="display:flex">
              <TargetSelection v-if="np_list.length!=0" :dataset_metadata="dataset_metadata" :targets="entity_data" @target-selected="updateTarget"></TargetSelection>
              <TopicSelection  v-if="topic_list.length!=0"  :topics="topic_list" @topic-selected="updateTopic" style="flex:0.5"></TopicSelection>
            </div> -->
            <!-- <Filter v-if="selected_target.length!=0" :outlet_set="outlet_set"
            @outlet-filtered="updateEnabledOutlet"
            ></Filter>
          <MonthSlider v-if="selected_target.length!=0" v-model:selectedRange="timeRange" ></MonthSlider> -->

          </SplitterPanel>
        </Splitter>
      </SplitterPanel>
      <!-- <SplitterPanel id='detail-section' class="flex align-items-center justify-content-center" :size="22">
        <p> detail </p>
      </SplitterPanel> -->
    </Splitter>
  </main>
</template>

<style scoped>
.splitter-outmost {
  width: 97vw;
  height: 95vh;
}
.entity-grid-container {
    display: grid;
    height: 90vh;
    width: 95vh;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(7, 1fr);  
}
:deep(.outlet-scatter:hover .outlet-scatterplot) {
    filter: brightness(80%);
    background-color: rgb(191, 189, 189);
}
</style>
