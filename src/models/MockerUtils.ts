// import { faker } from 'faker'

import { faker } from '@faker-js/faker'

export class Parameter {
    name: string
    schema: object

    constructor(name: string, schema: object){
        this.name = name
        this.schema = schema
    }

    public static arrayFrom(parameters: any[], openapi: object){
        if (parameters) {
            parameters.forEach((p, index) => {
                if (Object.keys(p).includes("$ref")){
                    parameters[index] = MockerUtils.resolveRef(p['$ref'], openapi)
                }
            })
            return parameters.filter(param => param.in == "path").map((param) =>  new Parameter(param.name, param.schema))
        }
        else return []
    }
}

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
                return schema.enum ? schema.enum[0] : faker.person.firstName();
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

    public static generatePath(path: string, parameters: Parameter[], openapi: object) {        
        if (!parameters.length) return path

        const pathArray = path.split("/")
        pathArray.forEach((part, index) => {
            if (part.startsWith('{') && part.endsWith('}')) {
                pathArray[index] = this.generateExample(parameters.filter(param => param.name == part.slice(1,-1))[0].schema, openapi)
            }
            
        })
        return pathArray.join("/")
    }
}