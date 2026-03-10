let app = new Vue({
    el: '#app',
    data: {
        tasks: []
    },
    methods: {

    }
})

Vue.component('kanban-column', {
    props:{
        title:{
            type:String,
            required:true
        },
        status:{
            type:String,
            required:true
        },
        tasks:{
            type:Array,
            required:true
        }
    },
    template: ``,
    methods: {

    }
})