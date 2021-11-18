import SchemaBuilder from "../lib/SchemaBuilder";
import Course from "./models/Course";
import Category from "./models/Category";

const a = new SchemaBuilder([Course,Category])

console.log(a.build())
