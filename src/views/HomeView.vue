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
},
  data() {
    return {
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
      selected_target:[]
    }
  },

  methods: {
    updateDataset(dataset) {
      this.dataset = dataset
      this.outlet_set = dataset.outlet_set
      this.enabled_outlet_set = dataset.outlet_set
      this.topic_list = Object.keys(dataset.topic_dict)
      this.np_list = dataset.np_list
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
      this.selected_target = [target]
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
            :dataset="dataset"
            :enabled_outlet_set="enabled_outlet_set"
            :targets="selected_target"
            >
            </TargetContainer>
          </SplitterPanel>
          <SplitterPanel id='sidebar' class="flex align-items-center justify-content-center" :size="20" :min-size="20">
            <MyToolbar @graph-dev="updateDataset"></MyToolbar>
            <div class="selection_container" style="display:flex">
              <TopicSelection  v-if="topic_list.length!=0"  :topics="topic_list" @topic-selected="updateTopic" style="flex:0.5"></TopicSelection>
              <TargetSelection v-if="selected_topic!=''" :targets="np_list" @target-selected="updateTarget"></TargetSelection>
            </div>
            <Filter v-if="selected_target.length!=0" :outlet_set="outlet_set"
            @outlet-filtered="updateEnabledOutlet"
            ></Filter>
            <div>Time range slider</div>

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
