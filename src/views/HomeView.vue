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
},
  data() {
    return {
      original_dataset: {
        graphList:[],
        outlet_set:[],
        topic_dict:[],
        np_list:[]
      },
      dataset: {
        graphList:[],
        outlet_set:[],
        topic_dict:[],
        np_list:[]
      },
      outlet_set: [],
      enabled_outlet_set:[],
      selected_articles: [],
      topic_list:[],
      np_list:[],
      selected_topic:"",
      selected_target:[],
      timeRange:[1,13],
      outlet_article_dict: {}
    }
  },
  methods: {
    updateNpList(np_list) {
      // this.dataset = dataset
      // this.outlet_set = dataset.outlet_set
      // this.enabled_outlet_set = dataset.outlet_set
      // this.topic_list = Object.keys(dataset.topic_dict)
      this.np_list = np_list
      this.outlet_article_dict
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
    updateTarget(target) {
      const index = this.entity_list.indexOf(target) 
      this.selected_target = [target]
      const article_list = this.np_list[index][1]
      // TODO: query data from graphql
      const dataset = this.$refs.toolbar.getData(target)
      this.original_dataset = dataset
      // sort by date and update time range
      dataset.sort((a1, a2) => Date.parse(a1.timestamp) > Date.parse(a2.timestamp))
      const startMonth = parseInt(dataset[0].timestamp.split('-')[1])
      const endMonth = parseInt(dataset[dataset.length-1].timestamp.split('-')[1])
      this.timeRange = [startMonth, endMonth+1]
      this.updateDicts(dataset)
    },
    updateDicts(dataset) {
      // group by topic and outlet
      // clear
      const topic_dict = {}
      for(let outlet of Object.keys(this.outlet_article_dict)) {
        this.outlet_article_dict[outlet] = []
      }
      for(const article of dataset) {
          // topic
          if(!topic_dict[article.top_level_topic]) {
              topic_dict[article.top_level_topic] = []
          }
          topic_dict[article.top_level_topic].push(article.id)
          // outlet
          if(!this.outlet_article_dict[article.journal]) {
              this.outlet_article_dict[article.journal] = []
          }
          this.outlet_article_dict[article.journal].push(article)
      }
      this.outlet_set = Object.keys(this.outlet_article_dict)
      this.enabled_outlet_set = this.outlet_set
      this.topic_list = Object.keys(topic_dict)
      this.dataset = dataset
    }
  },
  watch: {
    timeRange: function(new_range, old_range) {
      if(new_range[0] != old_range[0] || new_range[1] != old_range[1]) {
        const startIndex = this.original_dataset.findIndex(article => parseInt(article.timestamp.split('-')[1]) >= new_range[0])
        const endIndex = this.original_dataset.findIndex(article => parseInt(article.timestamp.split('-')[1]) > new_range[1]-1)
        const subset = this.original_dataset.slice(startIndex, endIndex)
        this.updateDicts(subset)
      }
    }
  },
  computed: {
    entity_list: function() {
      return this.np_list.map(entity_mentions => entity_mentions[0])
    }
  }
}
</script>

<template>
  <main>
    <Splitter style="height:120vh" layout="vertical">
      <SplitterPanel id="overview-section" class="flex align-items-center justify-content-center" :size="80">
        <Splitter>
          <SplitterPanel id='target-section' class="flex align-items-center justify-content-center" :size="85"> 
            <TargetContainer
            :outlet_article_dict="outlet_article_dict"
            :enabled_outlet_set="enabled_outlet_set"
            :targets="selected_target"
            :topic="selected_topic"
            :selectedTimeRange="timeRange"
            >
            </TargetContainer>
          </SplitterPanel>
          <SplitterPanel id='sidebar' class="flex align-items-center justify-content-center" :size="20" :min-size="20">
            <MyToolbar ref="toolbar" @candidate_updated="updateNpList"  ></MyToolbar>
            <div class="selection_container" style="display:flex">
              <TargetSelection v-if="np_list.length!=0" :targets="entity_list" @target-selected="updateTarget"></TargetSelection>
              <!-- <TopicSelection  v-if="topic_list.length!=0"  :topics="topic_list" @topic-selected="updateTopic" style="flex:0.5"></TopicSelection> -->
            </div>
            <Filter v-if="selected_target.length!=0" :outlet_set="outlet_set"
            @outlet-filtered="updateEnabledOutlet"
            ></Filter>
          <MonthSlider v-model:selectedRange="timeRange" ></MonthSlider>

          </SplitterPanel>
        </Splitter>
      </SplitterPanel>
      <SplitterPanel id='detail-section' class="flex align-items-center justify-content-center" :size="20">
        <p> detail </p>
      </SplitterPanel>
    </Splitter>
  </main>
</template>

<style scoped>
main {
  max-width:1280px;
}

</style>
