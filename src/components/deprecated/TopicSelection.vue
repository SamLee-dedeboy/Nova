<script>
import { defineComponent } from '@vue/composition-api'
import MegaMenu from 'primevue/megamenu';
export default defineComponent({
    components: {
        MegaMenu
    },
    props:['topics'],
    emits: ["topic-selected"],
    data() {
        return {
            items:[
                {
                    label: "Topic",
                    items: [[{items:this.topics.map(topic => Object({label: topic}))}]]
                }
            ]
        }
    },
    methods: {
        toggle(event) {
            this.$refs.topic_menu.toggle(event);
        },
        topicClicked(event) {
            if(this.topics.includes(event.target.textContent)){
                this.$emit("topic-selected", event.target.textContent)
            }
            // if(event.target.className == "p-menuitem-text" || event.target.className == "p-menuitem-link")
            //     this.$emit("topic-selected", event.target.textContent)
        }
    }

})
</script>

<template>
    <!-- <Button type="button" label="Topic" @click="toggle" /> -->
    <MegaMenu :model="items" @click=topicClicked />
        
</template>
<style>
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

</style>