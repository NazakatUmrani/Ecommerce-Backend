import mongoose from 'mongoose';
import crypto from "crypto";

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
  },
  resetPasswordToken : String,
  resetPasswordExpire : Date,
}, {timestamps: true});

UserSchema.pre('save', async function(next) {
  this.firstName = this.firstName.charAt(0).toUpperCase() + this.firstName.slice(1).toLowerCase();
  this.lastName = this.lastName.charAt(0).toUpperCase() + this.lastName.slice(1).toLowerCase();
  
  const username = `${this.firstName}+${this.lastName}`;
  this.profilePic = `https://avatar.iran.liara.run/username?username=${username}`;
  next();
});

userSchema.methods.getResetPasswordToken = function (){
  // generating token 
  const resetToken = crypto.randomBytes(20).toString("hex");
  
  // hashing and adding resetPasswordToken to userschema
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

export default mongoose.model('user', UserSchema);