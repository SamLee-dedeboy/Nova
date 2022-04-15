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
    <Splitter style="height:100vh">
      <SplitterPanel class="flex align-items-center justify-content-center" :size="80">
        <Splitter layout="vertical" >
          <SplitterPanel class="flex align-items-center justify-content-center" :size="10"> 
            <MyToolbar/>
          </SplitterPanel>
          <SplitterPanel class="flex align-items-center justify-content-center" :size="90">
              <Splitter layout="vertical" >
                <SplitterPanel class="flex align-items-center justify-content-center" :size="10">
                  <Filter></Filter>
                </SplitterPanel>
                <SplitterPanel class="flex align-items-center justify-content-center" :size="90">
                  <Target></Target>
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
