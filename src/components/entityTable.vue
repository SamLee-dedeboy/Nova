<template>
    <div id="entityList" class="entityList">
        <DataTable :value="entityList" :paginator="true" :rows="2" :rowHover="true" sortField="frequency" :sortOrder="-1" 
         :scrollable="true" scrollHeight="flex" 
         v-model:selection="table_selection" paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink ">
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

const emit = defineEmits(['update:selected_entity_name'])
// const selectedEntity = ref()
const table_selection = ref()


watch(() => props.selected_entity_name, () => {
    table_selection.value = {
        'entity': props.selected_entity_name,
        'frequency': 0,
    }
})

watch(table_selection, () => {
    console.log("table_selection changed", table_selection.value)
    const entityName = table_selection.value.entity.replaceAll(" ", "_")
    console.log(entityName)
    emit("update:selected_entity_name", entityName)
})

const props = defineProps({
    view: Object as () => EntityScatterView,
    article_num_threshold: Number,
    selected_entity_name: Object as () => Any,
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