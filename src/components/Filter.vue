<script>
import Divider from "primevue/divider"
import Chip from "primevue/chip"
export default {
    components: {
    Divider,
    Chip
    },
    props: ['outlet_set'],
    emits:["outlet-filtered"],
    data() {
        return {
            enabled_outlet_set:[]
        }
    },
    mounted() {
        this.enabled_outlet_set = this.outlet_set.map(function(outlet) {return {outlet:outlet,enabled:true}; })
    },
    watch: {
        outlet_set: function() {
            this.enabled_outlet_set = this.outlet_set.map(function(outlet) {return {outlet:outlet,enabled:true}; })
        }
    },
    emit: ["outlet-filtered"],
    methods: {
        updateFilter(event, index) {
            var old_state = event.target.getAttribute("data-selected")
            if(old_state == "selected") {
                event.target.classList.remove("p-button-raised")
                event.target.classList.add("p-button-outlined")
                event.target.setAttribute("data-selected", "not_selected")
                this.enabled_outlet_set[index].enabled=false
            } else {
                event.target.classList.remove("p-button-outlined")
                event.target.classList.add("p-button-raised")
                event.target.setAttribute("data-selected", "selected")
                this.enabled_outlet_set[index].enabled=true
            }
            this.$emit("outlet-filtered", this.enabled_outlet_set)

        }
    }
}
</script>

<template>
        <Chip class='header' label="Filter" />
        <div class='button-container'>
        <Button
            v-for="(outlet, index) in enabled_outlet_set" :key="outlet"
            @click ="updateFilter($event, index)"
            data-selected=selected
            >{{outlet.outlet}}
        </Button>
    </div>
</template>
<style scoped>

.clicked  {
    background-color: black;
}
Button {
    margin: 10px;
    border-radius: 8px;
    font-size: small;
}
.p-chip {
    margin-bottom:10px;
    left: 10px;
    top:10px;
    bottom:10px;
    padding: 0 2em !important;
}
div.button-container {
    border-style:double;
    margin:5px;
}
</style>
