import Course from "./models/Course";
import Category from "./models/Category";
import index from '../index'

const a = new index.SchemaBuilder([Course,Category])
//
// console.log(a.build())
