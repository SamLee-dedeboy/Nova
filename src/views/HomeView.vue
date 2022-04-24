<script>

import Filter from "../components/Filter.vue";
//import Target from "../components/Target.vue";
import TargetContainer from "../components/TargetContainer.vue";
import MyToolbar from "../components/MyToolbar.vue"
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
export default {
  components: {
    Filter,
    MyToolbar,
    Splitter,
    SplitterPanel,
    TargetContainer
  },
  data() {
    return {
      dataset: {
        graphList:[],
        outlet_set:[]
      },
      outlet_set: [],
      enabled_outlet_set:[]
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
                  <Splitter layout="vertical" >
                    <SplitterPanel class="flex align-items-center justify-content-center" :size="20">
                      <TargetContainer :dataset="dataset" :enabled_outlet_set="enabled_outlet_set"></TargetContainer>
                    </SplitterPanel>
                    <SplitterPanel class="flex align-items-center justify-content-center" :size="80">
                      <p>article panel</p>
                    </SplitterPanel>
                  </Splitter>

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
