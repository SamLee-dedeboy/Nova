<template>
    <div id="entityList" class="entityList">
        <DataTable :value="entityList" :paginator="true" :rows="2" :rowHover="true" sortField="frequency" :sortOrder="-1" 
         :scrollable="true" scrollHeight="flex" 
         v-model:selection="selectedEntity" paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink ">
            <Column selectionMode="single" header="Selection"></Column>
            <Column sortable field="entity" header="Topic"></Column>
            <Column sortable field="frequency" header="Frequency"></Column>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';
import { FilterMatchMode, FilterOperator } from "primevue/api";

import { onMounted, computed, Ref, ref, defineEmits, watch , watchEffect} from 'vue'
import { ScatterNode, EntityScatterView } from '../types'

const emit = defineEmits(['topic_selected'])
const selectedEntity = ref()

watch(selectedEntity, (selectedEntity) => {
    const entityName = selectedEntity.entity.replaceAll(" ", "_")
    emit("topic_selected", entityName)
})

const props = defineProps({
    view: Object as () => EntityScatterView,
    article_num_threshold: Number
})

const filtered_data = computed(() => props.view?.data.nodes.filter((node: ScatterNode) => node.article_ids.length > (props.article_num_threshold || 0))) as Ref<ScatterNode[]>
const entityList = filtered_data.value.map(data => {
    return {
        'entity': data.text.replaceAll("_", " "),
        'frequency': data.article_ids.length
    }
})

console.log("Entity List", entityList)



</script>