<script setup lang="ts">
/**
 * libraries
 */
import * as vue from "vue"
import {Ref, ref} from 'vue'
import { useStore } from 'vuex'

/**
 * vue components
 */
import OutletWeightSlider from "../components/OutletWeightSlider.vue";

const store = useStore()
const notes = vue.computed(() => store.state.notes)
const selected_entity = vue.computed(() => store.state.selected_entity)
const outlet_weight_dict = vue.computed(() => store.state.outlet_weight_dict)
const constraint_dict = vue.computed(() => store.state.constraints)
const marked_articles = vue.computed(() => store.state.marked_articles)


</script>

<template>
<div class="summary-container">
    <h2 class="component-header summary-header"> 
        Summary
    </h2>
    <div class="summary-content">
        <div class="hypothesis-container">
            <div class="belief-section">
                <div class="main-topic-container">
                    <span> Main topic: {{ selected_entity.name }} </span>
                </div>
                <div class="outlet-weight-container">
                    <OutletWeightSlider :outlet_weight_dict="outlet_weight_dict"></OutletWeightSlider>
                </div>
            </div>
            <div class="hypothesis-section">
                <h2 class="component-header hypothesis-header"> 
                    Notes
                </h2>
                <div class="hypothesis-content">
                    {{notes}}
                </div>
            </div>
        </div>
        <div class="conclustion-container">
            <h2 class="component-header conclusion-header"> 
                Conclusion
            </h2>
            <div class="conclusion-content">
                <div class="constraint-container"
                v-for="outlet in Object.keys(constraint_dict[selected_entity.name])">
                    {{outlet}} - {{constraint_dict[selected_entity.name][outlet]}}
                </div>
                <div v-for="id in marked_articles">{{id}}</div>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped lang="scss">
.summary-container {
  width: 50vw;
  height: 98vh;
  display: flex;
  flex-direction: column;
  justify-content: left;
}


.summary-content {
  height: 100%;
  width: 100%;
}

.conclustion-container {
  width: 100%;
  height: 100%;
}

.belief-section {
  display: flex;
}

.main-topic-container {
  flex: 1 1 0;
}

.outlet-weight-container {
  flex: 1 1 0;
}


.hypothesis-container {
    width: 100%;
    height: 30%;
    margin: 0% 1% 1% 0%;
    background: #f7f7f7;
    // padding: 0% 1%;
    padding-left: 1%;
    padding-right: 1%;
}
.hypothesis-section {
    height: 30%;
}

.component-header.summary-header {
  background: #f7f7f7;
  padding-left: 1%;
  margin: 1% 0% 1% 0%;
}

.outlet-weight-container {
  padding: 1.5%;
}

.component-header.conclusion-header {
  background: #f7f7f7;
  margin: 0% 0% 0% 0%;
  padding-left: 1%;
}

</style>