import mongoose, { Model, mongo, Schema} from "mongoose";


interface IData {
    title: string; 
}

const DataSchema = new Schema<IData>({
    title: { type: String,
        required: [true, 'Title Required']
        }
});

const Data = mongoose.model<IData>('Data', DataSchema);

export default Data;