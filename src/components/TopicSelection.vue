<script>
import { defineComponent } from '@vue/composition-api'
import TieredMenu from 'primevue/tieredmenu';
export default defineComponent({
    components: {
        TieredMenu
    },
    props:['topics'],
    emits: ["topic-selected"],
    data() {
        return {
            items:[]
        }
    },
    mounted() {
        this.items = this.topics.map(topic => Object({label: topic}))
    },
    watch: {
        topics: function() {
            this.items = this.topics.map(topic => Object({label: topic}))
        }
    },
    methods: {
        toggle(event) {
            this.$refs.topic_menu.toggle(event);
        },
        topicClicked(event) {
            if(event.target.className == "p-menuitem-text" || event.target.className == "p-menuitem-link")
                this.$emit("topic-selected", event.target.textContent)
        }
    }

})
</script>

<template>
    <Button type="button" label="Topic" @click="toggle" />
    <TieredMenu ref="topic_menu" :model="items" :popup="true"
        style="width: auto"
        @click="topicClicked"
    >
        
    </TieredMenu>
</template>
