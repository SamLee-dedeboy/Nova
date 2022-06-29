<script>
import { defineComponent } from '@vue/composition-api'
import MegaMenu from 'primevue/megamenu';
import DataTable from 'primevue/datatable'
import {FilterMatchMode,FilterService} from 'primevue/api';
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Chip from "primevue/chip"
export default defineComponent({
    components: {
        MegaMenu,
        DataTable,
        Column,
        InputText,
        Chip,
    },
    props:['targets'],
    emits: ["target-selected"],
    computed: {
        target_list: function() {
            return this.targets
            return this.targets.map(target => Object({name: target}))
        } 
    },
    data() {
        return {
            target_test:[
                {
                    label: "Target",
                    // items: [[{items:this.targets.slice(0,10).map(target => Object({label: target}))}]]
                    items: [[{items:this.targets.map(target => Object({label: target}))}]]
                }
            ],
            selected_target: null,
            filters: {
                'global': {value: null, matchMode: FilterMatchMode.STARTS_WITH},
                'name': {value: null, matchMode: FilterMatchMode.STARTS_WITH},
                'num': {value: null, matchMode: FilterMatchMode.STARTS_WITH}
            }
        }
    },
    mounted() {
        FilterService.register("FuzzyMatch", (value, filter) => {
             if (filter === undefined || filter === null || filter.trim() === '') {
                return true;
            }
    
            if (value === undefined || value === null) {
                return false;
            }
            return value.toString === filter.toSting();
        })
    },
    watch: {
        selected_target: function() {
            this.$emit("target-selected", this.selected_target.name)
        }
    },
    methods: {
        toggle(event) {
            this.$refs.target_menu.toggle(event);
        },
        targetClicked(event) {
            if(this.targets.includes(event.target.textContent)){
                this.$emit("target-selected", event.target.textContent)
            }
        }
    }

})
</script>

<template>
    <!-- <MegaMenu :model="targets" @click=targetClicked /> -->
    <div class="TargetSelection">
        <DataTable 
        :value="target_list" 
        :scrollable="true" 
        v-model:selection="selected_target" selectionMode="single"
        class="p-datatable-sm"
        scrollHeight="300px" 
        responsiveLayout="scroll"
        v-model:filters="filters"
        :globalFilterFields="['name', 'num']"
        dataKey="name">
            <template #header>
            <!-- <Chip class='header' label="Target"  /> -->
            <div class="flex justify-content-center align-items-center">
                    <span class="m-0">Entity:</span>
                    <span>
                        <InputText v-model="filters['global'].value" placeholder="Search by Name" />
                    </span>
                 </div>
            </template>
            <template #empty>
                No target found.
            </template>
            <Column field="name" 
            header="Name"
            sortable
            style="text-overflow:ellipsis;overflow:hidden;display: inline-block; width:110px">
                <template #body="{data}">
                    <span :title="data.name" style="font-size:14px">{{data.name}}</span>
                </template>
                <!-- <template #filter="{filterModel}">
                    <InputText type="text" v-model="filterModel.value" class="p-column-filter" :placeholder="`Entity search by name`"/>
                </template> -->
                <!-- <template #filter="{filterModel, filterCallback}">
                    <InputText type="text" v-model="filterModel.value"  @input="filterCallback()" class="p-column-filter" :placeholder="`Entity search by name`"/>
                </template> -->
            </Column>
            <Column field="num" 
            header="Num"
            sortable
            style="text-overflow:ellipsis;overflow:hidden;display: inline-block; width:110px">

                <template #body="{data}">
                    <span :title="data.num" style="font-size:14px">{{data.num}}</span>
                </template>
                <!-- <template #filter="{filterModel}">
                    <InputText type="text" v-model="filterModel.value" class="p-column-filter" :placeholder="`Entity search by name`"/>
                </template> -->
                <!-- <template #filter="{filterModel, filterCallback}">
                    <InputText type="text" v-model="filterModel.value"  @input="filterCallback()" class="p-column-filter" :placeholder="`Entity search by name`"/>
                </template> -->
            </Column>
        </DataTable>
    </div>
</template>
<style>
.p-fluid.p-column-filter-element {
  display: contents !important;
}
.p-inputtext {
    left: 10px;
    font-size: 0.8rem !important;
    width: 60% !important; 
}
.p-datatable .p-datatable-thead > tr > th {
    border: none !important;
}
.p-datatable-header {
    display: block ruby;
}
.p-datatable .p-datatable-header {
    background-color: #ffff !important;
}
.p-datatable.p-datatable-sm .p-datatable-header {
    padding-top: 0px !important;
}
.p-chip {
    margin-bottom:10px;
    top:10px;
    padding: 0 2em !important;
    background-color: rgb(219, 221, 223) !important 
}
.p-megamenu .p-megamenu-submenu {
  width: auto !important;
}
.p-megamenu.p-component.p-megamenu-horizontal {
  --margin-horizontal: 10px;
  margin-left: var(--margin-horizontal);
  margin-right: var(--margin-horizontal);
  padding: inherit;
  width:fit-content;
}
.p-megamenu .p-megamenu-submenu-header {
  padding: 0rem !important;
}
.p-megamenu-panel {
  width: max-content;
}
.TargetSelection {
    border-style: solid;
    border-radius: 6px;
    border-width: 2px;
    border-color: ghostwhite;
    margin: 5px;
    padding-left: 5px;
    padding-right: 5px;
}
</style>