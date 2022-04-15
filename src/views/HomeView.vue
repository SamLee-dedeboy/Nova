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
  }
}
</script>

<template>
  <main>
    <Splitter layout="vertical" style="height:800px">
      <SplitterPanel class="flex align-items-center justify-content-center" :size="10"> 
        <MyToolbar/>
      </SplitterPanel>
      <SplitterPanel class="flex align-items-center justify-content-center" :size="90">
        <div>
          <Splitter layout="vertical" style="height:720px">
            <SplitterPanel class="flex align-items-center justify-content-center" :size="20">
              <Filter></Filter>
            </SplitterPanel>
            <SplitterPanel class="flex align-items-center justify-content-center" :size="80">
              <Target></Target>
            </SplitterPanel>
          </Splitter>
        </div>
      </SplitterPanel>
    </Splitter>

  </main>
</template>
