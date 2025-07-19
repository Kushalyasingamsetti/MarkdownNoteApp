
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
