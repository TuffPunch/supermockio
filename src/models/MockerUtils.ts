import { faker } from '@faker-js/faker'
import { randomInt } from 'crypto'

export class Parameter {
    name: string
    schema: object
    example: any

    constructor(name: string, schema: object, example: any) {
        this.name = name
        this.schema = schema
        this.example = example
    }

    public static arrayFrom(parameters: any[], openapi: object) {
        if (parameters) {
            parameters.forEach((p, index) => {
                if (Object.keys(p).includes("$ref")) {
                    parameters[index] = MockerUtils.resolveRef(p['$ref'], openapi)
                }
            })
            return parameters.filter(param => param.in == "path").map((param) => new Parameter(param.name, param.schema, param['example']))
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

    // for now we only fetch the first example the rest is ignored
    public static fetchDefinedExample(examples, openapi) {
        const firstKey = Object.keys(examples)[0]
        const firstExample = examples[firstKey]
        return (Object.keys(firstExample).includes("$ref")) ? this.resolveRef(firstExample["$ref"], openapi)["value"] : firstExample
    }

    public static generateExample(schema, openapi) {

        if (!schema) return {}

        schema = Object.keys(schema).includes("$ref") ? this.resolveRef(schema["$ref"], openapi) : schema

        if (Object.keys(schema).includes("allOf")) {
            return this.generateAllOfExample(schema["allOf"], openapi)
        }
        if (Object.keys(schema).includes("oneOf")) {
            const randomIndex = randomInt(schema["oneOf"].length)
            return this.generateExample(schema["oneOf"][randomIndex], openapi)
        }

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
                return Object.assign({}, schema.properties ? this.generateObjectExample(schema.properties, openapi) : {}, schema["additionalProperties"] ? this.generateExample(schema["additionalProperties"], openapi) : {});
            default:
                console.log(schema);
                throw new Error(`Unsupported schema type: ${schema.type}`);
        }
    }

    public static generateAllOfExample(allOfSchema, openapi) {
        const resultExample = {}
        allOfSchema.forEach(element => {
            Object.assign(resultExample, this.generateExample(element, openapi))
        });
        return resultExample
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
                const param = parameters.filter(param => param.name == part.slice(1, -1))[0]
                if (param.example) 
                    pathArray[index] = param.example
                else if (param.schema["default"])
                    pathArray[index] = param.schema["default"]
                else
                pathArray[index] = this.generateExample(param.schema, openapi)
            }

        })
        return pathArray.join("/")
    }
}