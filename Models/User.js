import mongoose from 'mongoose';
const { Schema } = mongoose;

const UserSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true,
		lowercase: true,
  },
	role: {
		type: String,
		default: "user",
		enum: ["user", "admin"],
	},
  profilePic: {
    type: String,
    default: ""
  }
}, {timestamps: true});

UserSchema.pre('save', async function(next) {
  this.firstName = this.firstName.charAt(0).toUpperCase() + this.firstName.slice(1).toLowerCase();
  this.lastName = this.lastName.charAt(0).toUpperCase() + this.lastName.slice(1).toLowerCase();
  
  const username = `${this.firstName}+${this.lastName}`;
  this.profilePic = `https://avatar.iran.liara.run/username?username=${username}`;
  next();
});

export default mongoose.model('user', UserSchema);