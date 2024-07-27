// import { faker } from 'faker'

import { faker } from '@faker-js/faker'

export class MockerUtils {
    public static resolveRef(refString, rootDoc) {
        const path = refString.split('/');
        path.shift(); // Remove the leading "#"
        let currentObject = rootDoc;
        for (const key of path) {
            currentObject = currentObject[key];
            if (!currentObject) {
                throw new Error(`Failed to resolve reference: ${refString}`);
            }
        }
        return currentObject;
    }

    public static generateExample(schema, openapi) {

        schema = Object.keys(schema).includes("$ref") ? this.resolveRef(schema["$ref"], openapi) : schema

        // Handle different schema types
        switch (schema.type) {
            case 'string':
                return schema.enum ? schema.enum[0] : faker.string.alpha(10);
            case 'number':
                return schema.enum ? schema.enum[0] : faker.number.float() * 10;
            case 'integer':
                return schema.enum ? schema.enum[0] : faker.number.int();
            case 'boolean':
                return schema.enum ? schema.enum[0] : faker.datatype.boolean();
            case 'array':
                return this.generateArrayExample(schema.items, openapi);
            case 'object':
                return this.generateObjectExample(schema.properties, openapi);
            default:
                throw new Error(`Unsupported schema type: ${schema.type}`);
        }
    }

    public static generateArrayExample(itemSchema, openapi) {
        const exampleArray = [];
        for (let i = 0; i < 3; i++) {
            exampleArray.push(this.generateExample(itemSchema, openapi));
        }
        return exampleArray;
    }

    public static generateObjectExample(properties, openapi) {
        const exampleObject = {};
        for (const [key, propSchema] of Object.entries(properties)) {

            exampleObject[key] = this.generateExample(propSchema, openapi);
        }
        return exampleObject;
    }
}