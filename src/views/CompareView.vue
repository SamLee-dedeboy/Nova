<script setup lang="ts">
import * as vue from "vue"
import {Ref, ref} from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import Splitter from 'primevue/splitter';
import SplitterPanel from "primevue/splitterpanel"
import HexCooccurrence from "../components/HexCooccurrence.vue";
import * as typeUtils from "../types"
import ToggleButton from "primevue/togglebutton";

const route = useRoute()
const store = useStore()
const segmentation = vue.computed(() => store.state.segmentation)
const setSegmentation = (segmentation) => store.commit("setSegmentation", segmentation) 

const left_section_size = 83 
const right_section_size = vue.computed(() => 100-left_section_size)
const server_address = vue.inject("server_address")
const hexview_grid: Ref<any[]> = ref([])
const data_fetched: Ref<boolean> = ref(false)
const showDiff: Ref<boolean> = ref(false)

vue.onMounted(async () => {
    const target_entity: string = route.params.entity as string
    const promiseArray: any[] = []
    promiseArray.push(new Promise((resolve) => {
        fetch(`${server_address}/hexview/grouped/${target_entity}`)
        .then(res => res.json())
        .then(json => {
            const data_list = json
            data_list.forEach(hex_data => {
                const hex_view: typeUtils.CooccurrHexView = {
                    title: `co-${hex_data.outlet}`,
                    type: typeUtils.ViewType.CooccurrHex,
                    data: hex_data
                }
                hexview_grid.value.push(hex_view)
            })
            resolve("success")
        })
    }))
    await Promise.all(promiseArray)
        .then(res => {
            data_fetched.value = true
            console.log("all fetched")
        })
})
</script>
<template>
    <Splitter class="splitter-outmost">
        <SplitterPanel id="hexview_section" class="hexview-section flex align-items-center justify-content-center" :size="left_section_size" >
            <div class="hexview-grid-container">
                <HexCooccurrence
                  v-if="data_fetched"
                  v-for="view, index in hexview_grid"
                    class="compare-co-hexview"
                    :title="view.title"
                    :id="`compare-co-hex-${index}`"
                    :entity_cooccurrences="view.data"
                    :segmentation="segmentation"
                    :showDiff="showDiff">
                </HexCooccurrence>
            </div>
        </SplitterPanel>    
        <SplitterPanel id="entity_info_section" class="entity-info-section flex align-items-center justify-content-center" :size="right_section_size" >
            <div class="entity-info-container"> {{ route.params.entity }}</div>
            <div class="utilities-container">
                <ToggleButton v-model="showDiff" class="w-full sm:w-10rem" onLabel="Show Diff" offLabel="Show Diff" />
            </div>

        </SplitterPanel>
    </Splitter>
</template>

<style scoped>
.splitter-outmost {
  width: 97vw;
  height: 95vh;
  display: flex;
}
:deep(.p-divider.p-divider-vertical::before) {
  border-left: 1px solid #dee2e6 !important;
}

.hexview-grid-container {
    display: grid;
    aspect-ratio: 3/2;
    max-height: 50%;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);  
    gap: 0;
    width: 100%;
    height: 100%;
}
</style>