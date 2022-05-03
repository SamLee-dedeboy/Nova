<script>

import Filter from "../components/Filter.vue";
//import Target from "../components/Target.vue";
import TargetContainer from "../components/TargetContainer.vue";
import MyToolbar from "../components/MyToolbar.vue"
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import ArticleView from "../components/ArticleView.vue";
import TopicSelection from "../components/TopicSelection.vue";
export default {
  components: {
    Filter,
    MyToolbar,
    Splitter,
    SplitterPanel,
    TargetContainer,
    ArticleView,
    TopicSelection
},
  data() {
    return {
      dataset: {
        graphList:[],
        outlet_set:[]
      },
      outlet_set: [],
      enabled_outlet_set:[],
      selected_articles: []
    }
  },

  methods: {
    updateDataset(dataset) {
      this.dataset = dataset
      this.outlet_set = dataset.outlet_set
      this.enabled_outlet_set = dataset.outlet_set
    }, 
    updateEnabledOutlet(outlet_set_info) {
      this.enabled_outlet_set = outlet_set_info.filter(outlet => outlet.enabled).map(outlet => outlet.outlet)
    },
    updateSelectedNode(node) {
      this.selected_articles = node.articles
    },
  }
}
</script>

<template>
  <main>
    <Splitter style="height:100vh" layout="vertical">
      <SplitterPanel id="overview-section" class="flex align-items-center justify-content-center" :size="80">
        <Splitter>
          <SplitterPanel id='target-section' class="flex align-items-center justify-content-center" :size="85"> 
            <TargetContainer
            :dataset="dataset"
            :enabled_outlet_set="enabled_outlet_set"
            :targets="['Joe Biden']"></TargetContainer>
          </SplitterPanel>
          <SplitterPanel id='sidebar' class="flex align-items-center justify-content-center" :size="15">
            <MyToolbar @graph-dev="updateDataset"></MyToolbar>
            <TopicSelection></TopicSelection>
 
            <div>Target selection section</div>
            <div>Time range slider</div>
            <Filter :outlet_set="outlet_set"
            @outlet-filtered="updateEnabledOutlet"></Filter>
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
