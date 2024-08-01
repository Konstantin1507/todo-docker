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
      default: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const Todo = mongoose.model('Todo', todoSchema);

export default Todo;
