import Course from "./models/Course";
import Category from "./models/Category";
import knex, {Knex} from 'knex'
import {join} from "path";
import * as os from "os";
import {before, describe} from "mocha";
import {expect} from 'chai'
import CustomModel from "../lib/CustomModel";
import * as fs from "fs";
import index from '../index'
import SchemaBuilder from "../lib/SchemaBuilder";
import {graphql, buildSchema} from "graphql";
import {makeExecutableSchema} from "@graphql-tools/schema";

//
// console.log(a.build())

describe('Testing module', (() => {
    let db: Knex, schemaBuilder: SchemaBuilder, models: (typeof CustomModel)[];
    before(() => {
        fs.unlinkSync(join(os.tmpdir(), 'graphqltest2.db'))
    })
    before(() => {
        db = knex({
            client: 'sqlite3',
            connection: {filename: join(os.tmpdir(), 'graphqltest2.db')},
            useNullAsDefault: true
        })
        CustomModel.knex(db)
    })
    before(() =>
        db.schema.createTable('Category', table => {
            table.increments('id')
            table.string('name')
            table.integer('parentCategoryId').unsigned()
            table.foreign('parentCategoryId').references('id').inTable('category').onUpdate('CASCADE').onDelete('SET NULL')
            table.timestamp('createdAt', {useTz: false}).defaultTo(db.fn.now())
            table.timestamp('updatedAt', {useTz: false}).defaultTo(db.fn.now())
        })
    )
    before(() =>
        db.schema.createTable('Course', table => {
            table.increments('id')
            table.string('name')
            table.string('description')
            table.integer('categoryId').unsigned()
            table.foreign('categoryId').references('id').inTable('category').onUpdate('CASCADE').onDelete('SET NULL')
            table.timestamp('createdAt', {useTz: false}).defaultTo(db.fn.now())
            table.timestamp('updatedAt', {useTz: false}).defaultTo(db.fn.now())
        })
    )
    before(() => Course.query().insertGraph([{
        name: 'Course 1',
        description: 'Course 1 description',
        category: {
            name: 'Category 1',
            children: {
                '#id': 'cat2',
                name: 'Category 2'
            }
        }
    }, {
        name: 'Course 2',
        description: 'Course 2 description',
        category: {'#ref': 'cat2'}
    }], {allowRefs: true}))
    it('should populate database', async () => {
        const Courses = await Course.query().select().withGraphFetched('category.children')
        expect(Courses[0]).to.have.all.keys('id', 'name', 'category', 'categoryId', 'description', 'createdAt', 'updatedAt')
        expect(Courses[1]).to.have.all.keys('id', 'name', 'category', 'categoryId', 'description', 'createdAt', 'updatedAt')
        expect(Courses[2]).to.not.exist
    })
    it('should create builder', () => {
        const models = [Category, Course]
        schemaBuilder = new index.SchemaBuilder(models)
    })
    it('should build schema',()=>{
        const {typeDefs,resolvers} = schemaBuilder.build()
        expect(typeDefs).to.include(`type Course{
id: Int
name: String
description: String
categoryId: Int
category: Category
}
`).and.not.include(`createCategory`)
        console.log(resolvers)
    })
    // it('should query',()=>{
    //     // makeExecutableSchema(schemaBuilder.build())
    //     buildSchema(schemaBuilder.build().typeDefs)
    //     // const graphqle = graphql({schema:buildSchema(schemaBuilder.build().typeDefs)})
    // })

    return

}))
