export interface UIField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  children: UIField[];
}

// Converts a standard JSON Schema to a UI-friendly format
export const jsonSchemaToUi = (schema: any): UIField[] => {
  if (!schema || schema.type !== 'object' || !schema.properties) {
    return [];
  }

  const convert = (properties: any): UIField[] => {
    return Object.keys(properties).map(key => {
      const prop = properties[key];
      const field: UIField = {
        id: `field_${key}_${Math.random()}`,
        name: key,
        type: prop.type || 'string',
        children: [],
      };

      if (prop.type === 'object' && prop.properties) {
        field.children = convert(prop.properties);
      }

      if (prop.type === 'array' && prop.items && prop.items.type === 'object' && prop.items.properties) {
        field.children = convert(prop.items.properties);
      }
      
      return field;
    });
  };

  return convert(schema.properties);
};

// Converts the UI-friendly format back to a standard JSON Schema
export const uiToJSONSchema = (fields: UIField[]): object => {
    const schema: any = {
        type: 'object',
        properties: {},
        required: [] // TODO: Add support for required fields in UI
    };

    const convert = (uiFields: UIField[]): any => {
        const properties: any = {};
        uiFields.forEach(field => {
            if (!field.name) return;

            const prop: any = { type: field.type };

            if (field.type === 'object') {
                prop.properties = convert(field.children);
            } else if (field.type === 'array') {
                prop.items = {
                    type: 'object', // For now, we assume array contains objects
                    properties: convert(field.children)
                };
            }
            properties[field.name] = prop;
        });
        return properties;
    }

    schema.properties = convert(fields);
    // Clean up empty required array
    if (schema.required.length === 0) {
        delete schema.required;
    }

    return schema;
};


// Generates an example JSON object from a given JSON schema
export function generateExampleFromJsonSchema(schema: any): any {
    if (!schema || typeof schema !== 'object') {
        return {};
    }

    const generateValue = (propSchema: any): any => {
        if (!propSchema) return null;

        const { type, properties, items, example, default: defaultValue, enum: enumValues, description } = propSchema;

        if (example) return example;
        if (defaultValue) return defaultValue;
        if (enumValues && enumValues.length > 0) return enumValues[0];

        switch (type) {
            case 'object':
                if (properties) {
                    const obj: { [key: string]: any } = {};
                    for (const key in properties) {
                        obj[key] = generateValue(properties[key]);
                    }
                    return obj;
                }
                return {};
            case 'array':
                if (items) {
                    // Generate one example item for the array
                    return [generateValue(items)];
                }
                return [];
            case 'string':
                return description || 'example_string';
            case 'number':
                return 123.45;
            case 'integer':
                return 123;
            case 'boolean':
                return true;
            default:
                return null;
        }
    };

    return generateValue(schema);
}