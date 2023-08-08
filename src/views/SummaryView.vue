<script setup lang="ts">
/**
 * libraries
 */
import * as vue from "vue"
import * as d3 from "d3"
import {Ref, ref } from 'vue'
import { useUserDataStore } from '../store/userStore'
import ScrollPanel from 'primevue/scrollpanel'
import Panel from 'primevue/panel'
import SelectButton from "primevue/selectbutton"
import Dropdown from "primevue/dropdown"

/**
 * vue components
 */
import OutletWeightSlider from "../components/OutletWeightSlider.vue";
import HexCooccurrence from "../components/HexCooccurrence.vue"
import Summary from "../components/Summary.vue"

import * as SstColors from "../components/utils/ColorUtils"
import { Article, SentimentType, Sentiment2D, Constraint, ScatterNode, CooccurrHexView } from "../types"

const store = useUserDataStore()
const notes = vue.computed(() => store.notes)
const hex_selection = vue.computed(() => store.hex_selection)

</script>

<template>
<div class="page-container">
    <div class="summary-container">
        <h2 class="component-header summary-header"> 
            Summary
        </h2>
        <Summary :notes="notes" :hex_selection="hex_selection"></Summary>
    </div>
</div>
</template>

<style scoped lang="scss">
//
// Page containers
//
.page-container {
  width: 98vw;
  height: 98vh;
  display: flex;
}
.summary-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: left;
}

.summary-content {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-bottom: solid 1px #b7b7b7;
}

.conclusion-container {
    width: 100%;
    height: 100%;
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.component-header.summary-header {
  background: #f7f7f7;
  padding-left: 1%;
  margin: 1% 0% 1% 0%;
}

// 
// Main topic & outlet weights
//
.belief-section {
//   display: flex;
}

.main-topic-container {
  flex: 1 1 0;
}

.outlet-weight-container {
    flex: 1 1 0;
    padding: 1% 1% 1% 0%;
}

:deep(.outlet-weight-grid-container) {
  padding-top: 2%;
}

// slider handler size
:deep(.p-slider .p-slider-handle) {
  height: 0.8rem;
  width: 0.8rem;
  pointer-events: none;
}
:deep(.p-slider.p-slider-horizontal .p-slider-handle) {
  margin-top: -0.4rem;
  margin-left: -0.4rem;
}


//
// Hypothesis/Notes Section
//
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

//
// Conclusion Header
//
.component-header.conclusion-header {
  background: #f7f7f7;
  margin: 0% 0% 0% 0%;
  padding-left: 1%;
}
.constraint-header {
    padding-left: 1%;
}

:deep(.p-scrollpanel.p-component.conclusion-content) {
  height: 100%;
}
:deep(.p-scrollpanel-content) {
  height: 100%;
}
.fair_icon {
    color: red;
}
.unfair_icon {
    color: blue;
}

// 
// Right Section
// 
.summary-right-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  margin-left: 1%;
}

// hex
.entity-hive {
  max-height: 50%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.overview-hex-container {
  height: 100%;
  flex: 1 1 0;
}

// constraints table
.question-container {
  display: flex;
}
.question-content {
    text-align: center;
display: flex;
align-items: center;
}
.constraint-table {
  width: 100%;
  font-size: 0.8rem;
}
.relfection-container {
  width: 100%;
  display: flex;
//   height: 100%;
  overflow: hidden;
}

th {
  text-align: left;
  border-bottom: solid 1px;
}
.not_satisfied {
    background: #f88e8e;
    transition: background 1s;
}
.constraints-view {
  width: 100%;
}
.outlet-scatter-container {
  width: 100%;
}

:deep(.p-button) {
    padding: 0.1rem 1rem;
}

:deep(.p-buttonset, .p-button) {
    margin: 0.3rem 0rem;
}
.journal-info-container {
    width: fit-content;
    white-space: nowrap;
    margin: 0.3rem 0rem;
}
:deep(.p-inputtext) {
    padding: 0.2rem 0.5rem;
}
</style>
