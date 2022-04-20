<script>

import Filter from "../components/Filter.vue";
import Target from "../components/Target.vue";
import MyToolbar from "../components/MyToolbar.vue"
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
export default {
  components: {
    Filter,
    Target,
    MyToolbar,
    Splitter,
    SplitterPanel
  },
  data() {
    return {
      dataset: {
        graphList:[],
        outlet_set:[]
      },
      outlet_set: [],
      enabled_outlet_set:[
        {
          outlet:"",
          enabled:true
        }
      ]
    }
  },

  methods: {
    updateDataset(dataset) {
      this.dataset = dataset
      this.outlet_set = dataset.outlet_set
      this.enabled_outlet_set = dataset.outlet_set.map(function(outlet) {return {outlet:outlet,enabled:true}; })
    }, 
    updateEnabledOutlet(enabled_outlet_set) {
      console.log("filtered event captured")     
      this.enabled_outlet_set = enabled_outlet_set
      // this.dataset.graphList.forEach(graph => {
      //  graph.nodes =  graph.nodes.filter(node => this.enabled_outlet_set.filter(outlet => outlet.enabled).map(outlet => outlet.outlet).includes(node.outlet))
      // });

    }
  }
}
</script>

<template>
  <main>
    <Splitter style="height:100vh">
      <SplitterPanel class="flex align-items-center justify-content-center" :size="80">
        <Splitter layout="vertical" >
          <SplitterPanel class="flex align-items-center justify-content-center" :size="10"> 
            <MyToolbar @graph-dev="updateDataset"/>
          </SplitterPanel>
          <SplitterPanel class="flex align-items-center justify-content-center" :size="90">
              <Splitter layout="vertical" >
                <SplitterPanel class="flex align-items-center justify-content-center" :size="10">
                  <Filter v-bind:outlet_set="outlet_set"
                          @outlet-filtered="updateEnabledOutlet"></Filter>
                </SplitterPanel>
                <SplitterPanel class="flex align-items-center justify-content-center" :size="90">
                  <Target v-bind:dataset="dataset" :enabled_outlet_set="enabled_outlet_set"></Target>
                </SplitterPanel>
              </Splitter>
          </SplitterPanel>
        </Splitter>
      </SplitterPanel>
      <SplitterPanel class="flex align-items-center justify-content-center" :size="20">
        <p> side bar </p>
      </SplitterPanel>
    </Splitter>
  </main>
</template>

<style scoped>
main {
  max-width:1280px;
}
</style>
