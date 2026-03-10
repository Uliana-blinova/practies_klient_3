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
    template: `
    <div class="column">
            <h2>{{ title }}</h2>
            <div class="task-list">
                <task-card 
                    v-for="task in tasks" 
                    :key="task.id" 
                    :task="task"
                    :current-status="status"
                    @move-task="moveTask"
                    @edit-task="editTask"
                    @delete-task="deleteTask"
                ></task-card>
                <button v-if="status === 'planned'" @click="createTask">+ Добавить задачу</button>
            </div>
        </div>
    `,
    methods: {
        moveTask(payload) {
            this.$emit('move-task', payload);
        },
        editTask(task) {
            this.$emit('edit-task', task);
        },
        deleteTask(id) {
            this.$emit('delete-task', id);
        },
        createTask() {
            this.$emit('create-task', this.status);
        }
    }
})

Vue.component('task-card', {
    props:{
        task:{
            type:Object,
            required:true
        },
        currentStatus: {
            type: String,
            required: true
        }
    },
    template: `
    <div class="card" :class="{ 'overdue': isOverdue }">
            <h3>{{ task.title }}</h3>
            <p>{{ task.description }}</p>
            <div class="meta">
                <p>Создано: {{ task.createdAt }}</p><br>
                <p>Обновлено: {{ task.updatedAt }}</p><br>
                <p>Дэдлайн: {{ task.deadline }}</p>
                <div v-if="isOverdue" class="badge">Просрочено</div>
                <div v-else-if="currentStatus === 'done'" class="badge success">В срок</div>
            </div>
            
            <div class="actions">
                <button @click="edit">Редактировать</button>
                <button @click="remove">Удалить</button>
                <button v-if="currentStatus === 'planned'" @click="move('in_progress')">В работу</button>
                
                <button v-if="currentStatus === 'in_progress'" @click="move('testing')">На тестирование</button>
                
                <button v-if="currentStatus === 'testing'" @click="move('done')">Готово</button>
                <button v-if="currentStatus === 'testing'" @click="requestReturn">Вернуть в работу</button>
            </div>
            <p v-if="task.returnReason" class="reason">Причина возврата: {{ task.returnReason }}</p>
        </div>
`,
    computed: {
        isOverdue() {
            if (this.currentStatus !== 'done') return false;
            const now = new Date();
            const deadline = new Date(this.task.deadline);
            return now > deadline;
        }
    },
    methods: {
        move(newStatus) {
            this.$emit('move-task', { id: this.task.id, status: newStatus, reason: '' });
        },
        requestReturn() {
            const reason = prompt("Укажите причину возврата во второй столбец:");
            if (reason) {
                this.$emit('move-task', { id: this.task.id, status: 'in_progress', reason: reason });
            }
        },
        edit() {
            this.$emit('edit-task', this.task);
        },
        remove() {
            this.$emit('delete-task', this.task.id);
        }
    }

})

Vue.component('kanban-board', {
    template: `
        <div class="board">
            <kanban-column 
                v-for="col in columns" 
                :key="col.status"
                :title="col.title" 
                :status="col.status"
                :tasks="getTasksForStatus(col.status)"
                @move-task="moveTask"
                @edit-task="openEditForm"
                @delete-task="deleteTask"
                @create-task="openCreateForm"
            ></kanban-column>
            
            <div v-if="showForm" class="modal">
                <task-form 
                    :task="currentTask" 
                    @submit="saveTask" 
                    @cancel="showForm = false"
                ></task-form>
            </div>
        </div>
    `,
    data() {
        return {
            columns: [
                { title: 'Запланированные задачи', status: 'planned' },
                { title: 'Задачи в работе', status: 'in_progress' },
                { title: 'Тестирование', status: 'testing' },
                { title: 'Выполненные задачи', status: 'done' }
            ],
            tasks: [],
            showForm: false,
            currentTask: null
        }
    },
    methods: {
        getTasksForStatus(status) {
            return this.tasks.filter(t => t.status === status);
        },
        moveTask(payload) {
            const task = this.tasks.find(t => t.id === payload.id);
            if (task) {
                task.status = payload.status;
                task.updatedAt = new Date().toLocaleString();
                if (payload.reason) {
                    task.returnReason = payload.reason;
                } else {
                    task.returnReason = '';
                }
                if (payload.status === 'done') {
                }
            }
        },
        deleteTask(id) {
            this.tasks = this.tasks.filter(t => t.id !== id);
        },
        openCreateForm(status) {
            this.currentTask = {
                id: Date.now(),
                title: '',
                description: '',
                deadline: '',
                createdAt: new Date().toLocaleString(),
                updatedAt: new Date().toLocaleString(),
                status: status,
                returnReason: ''
            };
            this.showForm = true;
        },
        openEditForm(task) {
            this.currentTask = { ...task };
            this.showForm = true;
        },
        saveTask(taskData) {
            if (taskData.id) {
                const index = this.tasks.findIndex(t => t.id === taskData.id);
                if (index !== -1) {
                    taskData.updatedAt = new Date().toLocaleString();
                    this.tasks[index] = taskData;
                }
            } else {
                this.tasks.push(taskData);
            }
            this.showForm = false;
            this.currentTask = null;
        }
    }
});

Vue.component('task-form', {
    props: {
        task:{
            type: Object,
            required: true
        }
    },
    template: `
    <div class="form-container">
            <h3>{{ task.id ? 'Редактирование задачи' : 'Новая задача' }}</h3>
            <form @submit.prevent="submit">
                <div class="form-group">
                    <label>Заголовок:</label>
                    <input v-model="localTask.title" required>
                </div>
                <div class="form-group">
                    <label>Описание:</label>
                    <textarea v-model="localTask.description" required></textarea>
                </div>
                <div class="form-group">
                    <label>Дэдлайн:</label>
                    <input type="date" v-model="localTask.deadline" required>
                </div>
                <div v-if="errors.length" class="errors">
                    <ul>
                        <li v-for="error in errors">{{ error }}</li>
                    </ul>
                </div>

                <div class="buttons">
                    <button type="submit">Сохранить</button>
                    <button type="button" @click="cancel">Отмена</button>
                </div>
            </form>
        </div>
    `,
    data(){
        return {
            localTask:{...this.task},
            errors: []
        }
    },
    methods: {
        submit(){
            this.errors = [];
            if (!this.localTask.title) this.errors.push("Заголовок обязателен");
            if (!this.localTask.description) this.errors.push("Описание обязательно");
            if (!this.localTask.deadline) this.errors.push("Дэдлайн обязателен");

            if (this.errors.length === 0) {
                this.$emit('submit', this.localTask);
            }
        },
        cancel() {
            this.$emit('cancel');
        }
    }
})

