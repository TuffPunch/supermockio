import { faker } from '@faker-js/faker'
import { randomInt } from 'crypto'
import { GeminiService } from 'src/services/GeminiService'
import { AIServiceInterface } from './AIServiceInterface'

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

    public static resolveRefs(obj, rootDoc) {
        if (typeof obj !== 'object' || obj === null) {
          return obj; // Base case: not an object
        }
      
        if (Array.isArray(obj)) {
          return obj.map(item => this.resolveRefs(item, rootDoc));
        }
      
        const resolvedObj = {};
        for (const key in obj) {
          const value = obj[key];
          if(key === "$ref") {
            Object.assign(resolvedObj, this.resolveRefs(this.resolveRef(value, rootDoc), rootDoc)) ;
          } else {
            resolvedObj[key] = this.resolveRefs(value, rootDoc);
          }
        }
      
        return resolvedObj;
      }

    // for now we only fetch the first example the rest is ignored
    public static fetchDefinedExample(examples, openapi) {
        const firstKey = Object.keys(examples)[0]
        const firstExample = examples[firstKey]
        return (Object.keys(firstExample).includes("$ref")) ? this.resolveRef(firstExample["$ref"], openapi)["value"] : firstExample
    }

    public static async generateExampleWithAI(schema, openapi) {
        if (!schema) return {}

        const aiService : AIServiceInterface = new GeminiService() 
        const resolvedSchema = this.resolveRefs(schema, openapi)
        const prompt = `i want to generate an openapi response example for this endpoint
        don't add any additional attrivutes just stick to the ones in the provided definition :
        ${JSON.stringify(resolvedSchema, null, 4)}
        i want only the generated example as response please
        `

        return await aiService.ask(prompt)
    }

    public static async generatePathWithAi(path, param, openapi){
        param.schema = Object.keys(param.schema).includes("$ref") ? this.resolveRef(param.schema["$ref"], openapi) : param.schema
        const aiService = new GeminiService()
        const prompt = `i want you to generate an example value for my path param : ${param.name} used in this openapi path : ${path} return only the generated value `
 
        return await aiService.ask(prompt)
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

    public static async generatePath(path: string, parameters: Parameter[], openapi: object) {
        if (!parameters.length) return path

        const pathArray = path.split("/")
        for (let index = 0; index < pathArray.length; index++) {
            const part = pathArray[index]
            if (part.startsWith('{') && part.endsWith('}')) {
                const param = parameters.filter(param => param.name == part.slice(1, -1))[0]
                if (param.example) 
                    pathArray[index] = param.example
                else if (param.schema["default"])
                    pathArray[index] = param.schema["default"]
                else if (process.env['AI_GENERATION_ENABLED'] == "true")
                    pathArray[index] = await this.generatePathWithAi(path, param, openapi)
                else
                pathArray[index] = this.generateExample(param.schema, openapi)
            }

        }
        return pathArray.join("/")
    }
}