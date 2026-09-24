import mongoose from 'mongoose';
const schema=new mongoose.Schema({name:String,email:{type:String,unique:true},password:String,role:{type:String,enum:['DONOR','SHELTER','DRIVER','ADMIN']},organization:String,location:{lat:Number,lng:Number},createdAt:{type:Date,default:Date.now}}); export default mongoose.model('User',schema);
