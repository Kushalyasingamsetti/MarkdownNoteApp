// const mongoose = require("mongoose");

// const NoteSchema = new mongoose.Schema({
//   content: { type: String, required: true },
//   createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model("Note", NoteSchema);

// backend/models/Note.js
// const mongoose = require("mongoose");

// const noteSchema = new mongoose.Schema(
//   {
//     title: { type: String, required: true },
//     content: { type: String, required: true },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Note", noteSchema);

// const mongoose = require("mongoose");
// // const bcrypt = require("bcryptjs");

// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
// }, { timestamps: true });

// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

// const noteSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     default: "Untitled"
//   },
//   content: {
//     type: String,
//     required: true,
//   },
//   pinned: { 
//     type: Boolean, 
//     default: false },
//   }, 
//   tags: {
//     type: [String],  
//     default: []
//   },{ timestamps: true });

// module.exports = mongoose.model("Note", noteSchema);

const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "Untitled"
  },
  content: {
    type: String,
    required: true
  },
  pinned: {
    type: Boolean,
    default: false
   },
//   tags: {
//     type: [String], 
//     default: []     
//   }
},{ timestamps: true });

module.exports = mongoose.model("Note", noteSchema);
