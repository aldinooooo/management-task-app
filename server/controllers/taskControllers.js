import Notice from "../models/notification.js";
import Task from "../models/task.js";
import User from "../models/user.js";

//create task route
export const createTask = async (req, res) => {
  try {
    const { userId } = req.user;
    const { title, team, stage, date, priority, assets } = req.body;
    let text = "New task has been assigned to you";
    if (team?.length > 1) {
      text = text + `and ${team?.length - 1} others`;
    }
    text =
      text +
      ` The task priority is set a ${priority} priority, so check and act accordingly. The task date is ${new Date(
        date
      ).toDateString()}. Thank you!!!`;
    const activity = {
      type: "assigned",
      activity: text,
      by: userId,
    };
    const task = await Task.create({
      title,
      team,
      stage: stage.toLowerCase(),
      date,
      priority: priority.toLowerCase(),
      activities: activity,
    });
    await Notice.create({
      team,
      text,
      task: task._id,
    });
    res
      .status(200)
      .json({ status: true, task, message: "Task created successfully" });
  } catch (error) {
    console.log(`error in create task: ${error}`);
    return res.status(400).json({ status: false, message: error.message });
  }
};

//duplicate task route
export const duplicateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    const newTask = await Task.create({
      ...task,
      title: task.title + "- Duplicate",
    });
    newTask.team = task.team;
    newTask.subTasks = task.subTasks;
    newTask.assets = task.assets;
    newTask.priority = task.priority;
    newTask.stage = task.stage;
    await newTask.save();

    //alert users of the task
    let text = "New task has been assigned to you";
    if (task.team?.length > 1) {
      text = text + `and ${task.team?.length - 1} others`;
    }
    text =
      text +
      `The task priority is set a ${
        task.priority
      } priority, so check and act accordingly. The task date is ${task.date.toDateString()}.Thank you!!!`;
    await Notice.create({
      team: task.team,
      text,
      task: newTask._id,
    });
    res.status(200).json({
      status: true,
      message: "Task duplicated successfully",
    });
  } catch (error) {
    console.log(`error in duplicate task: ${error}`);
    return res.status(400).json({ status: false, message: error.message });
  }
};

//post task activity route
export const postTaskActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { type, activity } = req.body;
    const task = await Task.findById(id);
    const data = {
      type,
      activity,
      by: userId,
    };
    task.activities.push(data);
    await task.save();
    res
      .status(200)
      .json({ status: true, message: "Activity added successfully" });
  } catch (error) {
    console.log(`error in post task activity: ${error}`);
    return res.status(400).json({ status: false, message: error.message });
  }
};

//dashboard route
export const dashboardStatistics = async (req, res) => {
  try {
    const { userId, isAdmin } = req.user;
    const allTasks = isAdmin
      ? await Task.find({ isTrashed: false })
          .populate({ path: "team", select: "name role title email" })
          .sort({ _id: -1 })
      : await Task.find({ isTrashed: false, team: { $all: [userId] } })
          .populate({ path: "team", select: "name role title email" })
          .sort({ _id: -1 });

    const users = await User.find({ isActive: true })
      .select("name title role isAdmin createdAt")
      .limit(10)
      .sort({ _id: -1 });

    //group task by stage and calculate counts
    const groupTasks = allTasks.reduce((result, task) => {
      const stage = task.stage;
      if (!result[stage]) {
        result[stage] = 1;
      } else {
        result[stage] += 1;
      }
      return result;
    }, {});
    //group tasks by priority
    const groupData = Object.entries(
      allTasks.reduce((result, task) => {
        const { priority } = task;
        result[priority] = (result[priority] || 0) + 1;
        return result;
      }, {})
    ).map(([name, total]) => ({ name, total }));

    //calculate total tasks
    const totalTasks = allTasks?.length;
    const last10Task = allTasks?.slice(0, 10);
    const summary = {
      totalTasks,
      last10Task,
      users: isAdmin ? users : [],
      tasks: groupTasks,
      graphData: groupData,
    };
    res.status(200).json({ status: true, ...summary });
  } catch (error) {
    console.log(`error in dashboard statistics: ${error}`);
    return res.status(400).json({ status: false, message: error.message });
  }
};

//get all tasks route
export const getTasks = async (req, res) => {
  try {
    const { stage, isTrashed } = req.query;
    let query = { isTrashed: isTrashed ? true : false };
    if (stage) {
      query.stage = stage;
    }
    let queryResult = Task.find(query)
      .populate({
        path: "team",
        select: "name title email",
      })
      .sort({ _id: -1 });
    const tasks = await queryResult;
    res.status(200).json({ status: true, tasks });
  } catch (error) {
    console.log(`error in get tasks: ${error}`);
  }
};

//get single task route
export const getTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id)
      .populate({
        path: "team",
        select: "name title role email",
      })
      .populate({
        path: "activities.by",
        select: "name",
      });
    res.status(200).json({ status: true, task });
  } catch (error) {
    console.log(`error in get task: ${error}`);
    return res.status(400).json({ status: false, message: error.message });
  }
};

//create subtask route
export const createSubTask = async (req, res) => {
  try {
    const { title, tag, date } = req.body;
    const { id } = req.params;
    const newSubTask = { title, date, tag };
    const task = await Task.findById(id);
    task.subTasks.push(newSubTask);
    await task.save();
    res.status(200).json({ status: true, message: "Subtask created" });
  } catch (error) {
    console.log(`error in create subtask: ${error}`);
    res.status(400).json({ status: false, message: error.message });
  }
};

//update task route
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, team, stage, priority, assets } = req.body;
    const task = await Task.findById(id);
    task.title = title;
    task.date = date;
    task.priority = priority.toLowerCase();
    task.assets = assets;
    task.stage = stage.toLowerCase();
    task.team = team;

    await task.save();

    res
      .status(200)
      .json({ status: true, message: "Task Updated successfully." });
  } catch (error) {
    console.log(`error in update task: ${error}`);
    return res.status(400).json({ status: false, message: error.message });
  }
};
//trash task route
export const trashTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    task.isTrashed = true;
    await task.save();
    res.status(200).json({ status: true, message: "Task moved to trash" });
  } catch (error) {
    console.log(`error in trash task: ${error}`);
    res.status(400).json({ status: false, message: error.message });
  }
};

//delete restore task route
export const deleteRestoreTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { actionType } = req.query;
    if (actionType === "delete") {
      await Task.findByIdAndDelete(id);
    } else if (actionType === "deleteAll") {
      await Task.deleteMany({ isTrashed: true });
    } else if (actionType === "restore") {
      const resp = await Task.findById(id);
      resp.isTrashed = false;
      resp.save();
    } else if (actionType === "restoreAll") {
      await Task.updateMany(
        { isTrashed: true },
        { $set: { isTrashed: false } }
      );
    }
    res.status(200).json({ status: true, message: "Update successfully" });
  } catch (error) {
    console.log(`error in delete restore task: ${error}`);
    res.status(400).json({ status: false, message: error.message });
  }
};
