import {describe} from "mocha";
import index from "../index";
import Category from "./models/Category";
import Course from "./models/Course";
import {customFunctionHandler, handleOptions} from "../lib/utils";
import {expect} from "chai";

describe('Util functions', () => {
    describe('SchemaBuilder constructor options handler', () => {
        const schemaBuilder = new index.SchemaBuilder([Course, Category])
        it('handles query functions', () => {
            handleOptions(schemaBuilder, {queryFunction: (test: any) => test})
            expect(schemaBuilder.customQueryFunctionSingle && schemaBuilder.customQueryFunctionSingle('test')).equal('test')
            expect(schemaBuilder.customQueryFunctionMulti && schemaBuilder.customQueryFunctionMulti('test')).equal('test')
            handleOptions(schemaBuilder, {queryFunction: {single: (test: any) => test + '2'}})
            expect(schemaBuilder.customQueryFunctionSingle && schemaBuilder.customQueryFunctionSingle('test')).equal('test2')
            expect(schemaBuilder.customQueryFunctionMulti && schemaBuilder.customQueryFunctionMulti('test')).not.equal('test2')
        })
        it('handles mutation functions', () => {
            handleOptions(schemaBuilder, {mutationFunction: (test: any) => test})
            expect(schemaBuilder.customMutationFunctionCreate && schemaBuilder.customMutationFunctionCreate('test')).equal('test')
            expect(schemaBuilder.customMutationFunctionUpdate && schemaBuilder.customMutationFunctionUpdate('test2')).equal('test2')
            expect(schemaBuilder.customMutationFunctionDelete && schemaBuilder.customMutationFunctionDelete('test3')).equal('test3')
        })
        it('handles other options', () => {
            handleOptions(schemaBuilder, {extendProps: {id: {type: 'string'}}})
            expect(schemaBuilder.extendProps).to.have.property('id')
        })
    })
    describe('custom function handler', () => {
        it('should return promise', () => {
            return customFunctionHandler((test: string) => test, 'test').then(r => {
                expect(r).to.equal('test')
            })
        })
    })
})
