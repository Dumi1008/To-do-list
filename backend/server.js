const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Conectare la MongoDB (schimbă connection string-ul cu al tău dacă folosești Atlas)
mongoose.connect('mongodb://localhost:27017/todolist', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Definire model Task
const Task = mongoose.model('Task', {
    text: String,      // nume task
    start: String,     // start date
    due: String,       // due date
    priority: String,  // priority
    status: String     // status
});

// Rute API
app.get('/tasks', async (req, res) => {
    const tasks = await Task.find();
    res.json(tasks);
});

app.post('/tasks', async (req, res) => {
    const task = new Task(req.body);
    await task.save();
    res.json(task);
});

app.put('/tasks/:id', async (req, res) => {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(task);
});

app.delete('/tasks/:id', async (req, res) => {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

app.listen(3001, () => console.log('Server running on http://localhost:3001'));

app.delete('/tasks', async (req, res) => {
    await Task.deleteMany({});
    res.json({ success: true, message: 'Toate task-urile au fost șterse.' });
});