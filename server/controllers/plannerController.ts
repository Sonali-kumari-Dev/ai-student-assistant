import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { PlannerTasks } from '../db/mongo.js';

export async function getTasks(req: AuthRequest, res: Response): Promise<void> {
  try {
    const tasks = await PlannerTasks.find(
      { studentId: req.user._id },
      { sort: { dueDate: 1 } }
    );
    res.json({ tasks });
  } catch (err) {
    console.error('getTasks error:', err);
    res.status(500).json({ error: 'Failed to retrieve planner tasks.' });
  }
}

export async function createTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, category, priority, dueDate, dueTime } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Task title is required.' });
      return;
    }

    const task = await PlannerTasks.create({
      studentId: req.user._id,
      title: title.trim(),
      category: category || 'Study',
      priority: priority || 'Medium',
      dueDate: dueDate || '',
      dueTime: dueTime || '',
      completed: false,
    });

    res.status(201).json({
      message: 'Task added to your academic planner.',
      task,
    });
  } catch (err) {
    console.error('createTask error:', err);
    res.status(500).json({ error: 'Failed to create planner task.' });
  }
}

export async function updateTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, category, priority, dueDate, dueTime, completed } = req.body;

    const task = await PlannerTasks.findById(id);
    if (!task) {
      res.status(404).json({ error: 'Planner task not found.' });
      return;
    }

    if (task.studentId !== req.user._id) {
      res.status(403).json({ error: 'Forbidden. You do not own this task.' });
      return;
    }

    const updateData: Record<string, any> = {};
    if (title) updateData.title = title.trim();
    if (category) updateData.category = category;
    if (priority) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (dueTime !== undefined) updateData.dueTime = dueTime;
    if (completed !== undefined) updateData.completed = Boolean(completed);

    const updated = await PlannerTasks.findByIdAndUpdate(id, updateData);
    res.json({
      message: 'Planner task updated successfully.',
      task: updated,
    });
  } catch (err) {
    console.error('updateTask error:', err);
    res.status(500).json({ error: 'Failed to update planner task.' });
  }
}

export async function deleteTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const task = await PlannerTasks.findById(id);
    if (!task) {
      res.status(404).json({ error: 'Planner task not found.' });
      return;
    }

    if (task.studentId !== req.user._id) {
      res.status(403).json({ error: 'Forbidden. You do not own this task.' });
      return;
    }

    await PlannerTasks.findByIdAndDelete(id);
    res.json({ message: 'Planner task removed.' });
  } catch (err) {
    console.error('deleteTask error:', err);
    res.status(500).json({ error: 'Failed to delete planner task.' });
  }
}
