import mongoose from 'mongoose';
const schema=new mongoose.Schema({userId:String,message:String,type:String,read:{type:Boolean,default:false},createdAt:{type:Date,default:Date.now}}); export default mongoose.model('Notification',schema);
