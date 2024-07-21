const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,

    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true, // convert to lowercase for consistency
      validate: [/^\S+@\S+$/, "Invalid email address"], // basic email validation
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },
    role: {
      type: Number,
      default: 0,
      enum: [0, 1, 2], // restrict to specific roles (e.g., 0 = user, 1 = admin, 2 = moderator)
    },
    cart: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], // reference Product model
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // include virtual fields in JSON output
    toObject: { virtuals: true }, // include virtual fields in object output
  }
);

module.exports = mongoose.model("User", userSchema);