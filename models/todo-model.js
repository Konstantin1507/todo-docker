import mongoose from 'mongoose';
const { Schema } = mongoose;

const todoSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      required: true,
    },
    // userId: {
    //   type: String,
    //   required: true,
    // },
  },
  { timestamps: true }
);

const Todo = mongoose.model('Todo', todoSchema);

export default Todo;
