<template>
    <div id="entityList" class="entityList">
        <!-- <DataTable :value="entityList" :paginator="true" :rows="8" :rowHover="true" sortField="frequency" :sortOrder="-1"  -->
        <DataTable :value="entityList" 
        :rowHover="true" sortField="frequency" :sortOrder="-1" 
        :scrollable="true" scrollHeight="flex" 
        class="p-datatable-sm"
        v-model:selection="table_selection" selectionMode='single' dataKey='entity'
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink ">
            <!-- <Column selectionMode="single" header="Selection"></Column> -->
            <Column sortable field="entity" header="Topic"></Column>
            <Column sortable field="frequency" header="Articles" bodyStyle='padding-left: 10%'></Column>
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
    const entityName = table_selection.value.entity.replaceAll(" ", "_")
    emit("update:selected_entity_name", entityName)
})

const props = defineProps({
    entity_nodes: Object as () => ScatterNode[],
    article_num_threshold: Number,
    selected_entity_name: String,
})

const filtered_data = computed(() => props.entity_nodes.filter((node: ScatterNode) => node.article_ids.length > (props.article_num_threshold || 0))) as Ref<ScatterNode[]>
const entityList = computed(() => filtered_data.value.map(data => {
    return {
        'entity': data.text.replaceAll("_", " "),
        'frequency': data.article_ids.length
    }
}))




</script>

<style scoped>
.entityList {
    height: 100%;
}
:deep(.p-datatable-tbody) {
    font-size: 0.8rem;
}

</style>
