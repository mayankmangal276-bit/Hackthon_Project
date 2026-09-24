import mongoose from 'mongoose';
const schema=new mongoose.Schema({name:String,location:{lat:Number,lng:Number,address:String},capacity:Number,currentCapacity:Number,acceptedFoodTypes:[String],status:{type:String,default:'ACTIVE'}}); export default mongoose.model('Shelter',schema);
