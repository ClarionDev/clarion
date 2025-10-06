export interface SchemaPreset {
    name: string;
    description: string;
    schema: object;
}

export const schemaPresets: SchemaPreset[] = [
    {
        name: 'Simple Summary',
        description: 'A basic schema for a simple text summary.',
        schema: {
            "type": "object",
            "properties": {
                "summary": {
                    "type": "string",
                    "description": "A concise summary of the findings."
                }
            },
            "required": ["summary"]
        }
    },
    {
        name: 'File Operations',
        description: 'For tasks involving creating, modifying, or deleting files.',
        schema: {
            "type": "object",
            "properties": {
                "summary": {
                    "type": "string",
                    "description": "A summary of the file changes to be performed."
                },
                "file_changes": {
                    "type": "array",
                    "description": "A list of file modifications.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "action": {
                                "type": "string",
                                "enum": ["create", "modify", "delete"]
                            },
                            "path": {
                                "type": "string",
                                "description": "The relative path to the file."
                            },
                            "new_content": {
                                "type": "string",
                                "description": "The new content for 'create' or 'modify' actions."
                            }
                        },
                        "required": ["action", "path"]
                    }
                }
            },
            "required": ["summary", "file_changes"]
        }
    },
    {
        name: 'Code Review',
        description: 'Schema for providing structured feedback on code quality.',
        schema: {
            "type": "object",
            "properties": {
                "overall_assessment": {
                    "type": "string",
                    "description": "A high-level summary of the code quality."
                },
                "suggestions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "file_path": {
                                "type": "string"
                            },
                            "line_number": {
                                "type": "integer"
                            },
                            "comment": {
                                "type": "string",
                                "description": "The specific feedback or suggestion."
                            },
                            "severity": {
                                "type": "string",
                                "enum": ["Critical", "High", "Medium", "Low", "Informational"]
                            }
                        },
                        "required": ["file_path", "comment", "severity"]
                    }
                }
            },
            "required": ["overall_assessment", "suggestions"]
        }
    }
];
