const PARSE = Symbol("miniZodParse");

type Issue = {
  path: (string | number)[];
  message: string;
};

type ParseSuccess<T> = { success: true; data: T };
type ParseFailure = { success: false; issues: Issue[] };
type ParseResult<T> = ParseSuccess<T> | ParseFailure;

type Parser<T> = (value: unknown, path: (string | number)[]) => ParseResult<T>;

class MiniZodError extends Error {
  issues: Issue[];

  constructor(issues: Issue[]) {
    super("Validation failed");
    this.issues = issues;
  }

  flatten() {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of this.issues) {
      const key = issue.path.length ? issue.path.join(".") : "";
      (fieldErrors[key] ||= []).push(issue.message);
    }
    return { fieldErrors, formErrors: [] as string[] };
  }
}

type BaseSchema<T> = {
  safeParse(value: unknown):
    | { success: true; data: T }
    | { success: false; error: MiniZodError };
  optional(): BaseSchema<T | undefined>;
  [PARSE]: Parser<T>;
};

function createSchema<T>(parser: Parser<T>): BaseSchema<T> {
  const schema: Partial<BaseSchema<T>> = {};

  schema.safeParse = (value: unknown) => {
    const result = parser(value, []);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: new MiniZodError(result.issues) };
  };

  schema.optional = () =>
    createSchema<T | undefined>((value, path) => {
      if (value === undefined || value === null) {
        return { success: true, data: undefined };
      }
      return parser(value, path);
    });

  (schema as BaseSchema<T>)[PARSE] = parser;

  return schema as BaseSchema<T>;
}

function string(validations: ((value: string) => string | null)[] = []) {
  const parser: Parser<string> = (value, path) => {
    if (typeof value !== "string") {
      return { success: false, issues: [{ path, message: "Expected string" }] };
    }
    for (const validate of validations) {
      const message = validate(value);
      if (message) {
        return { success: false, issues: [{ path, message }] };
      }
    }
    return { success: true, data: value };
  };

  const schema = createSchema<string>(parser);

  return Object.assign(schema, {
    min(length: number) {
      return string([...validations, (value) => (value.length >= length ? null : `Expected at least ${length} characters`)]);
    },
    email() {
      return string([
        ...validations,
        (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : "Invalid email"),
      ]);
    },
    datetime() {
      return string([
        ...validations,
        (value) => (Number.isNaN(Date.parse(value)) ? "Invalid datetime" : null),
      ]);
    },
  });
}

function number(validations: ((value: number) => string | null)[] = []) {
  const parser: Parser<number> = (value, path) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return { success: false, issues: [{ path, message: "Expected number" }] };
    }
    for (const validate of validations) {
      const message = validate(value);
      if (message) {
        return { success: false, issues: [{ path, message }] };
      }
    }
    return { success: true, data: value };
  };

  const schema = createSchema<number>(parser);

  return Object.assign(schema, {
    int() {
      return number([
        ...validations,
        (value) => (Number.isInteger(value) ? null : "Expected integer"),
      ]);
    },
    min(minimum: number) {
      return number([
        ...validations,
        (value) => (value >= minimum ? null : `Must be greater than or equal to ${minimum}`),
      ]);
    },
    max(maximum: number) {
      return number([
        ...validations,
        (value) => (value <= maximum ? null : `Must be less than or equal to ${maximum}`),
      ]);
    },
  });
}

function unknown() {
  return createSchema<unknown>((value) => ({ success: true, data: value }));
}

type AnySchema = BaseSchema<any> & Record<string, any>;

function array(itemSchema: AnySchema) {
  const parser: Parser<any[]> = (value, path) => {
    if (!Array.isArray(value)) {
      return { success: false, issues: [{ path, message: "Expected array" }] };
    }
    const output: any[] = [];
    const issues: Issue[] = [];
    value.forEach((entry, index) => {
      const result = itemSchema[PARSE](entry, [...path, index]);
      if (result.success) {
        output.push(result.data);
      } else {
        issues.push(...result.issues);
      }
    });
    if (issues.length) {
      return { success: false, issues };
    }
    return { success: true, data: output };
  };

  return createSchema<any[]>(parser);
}

type Shape = Record<string, AnySchema>;

function object(shape: Shape) {
  const parser: Parser<Record<string, any>> = (value, path) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return { success: false, issues: [{ path, message: "Expected object" }] };
    }
    const result: Record<string, any> = {};
    const issues: Issue[] = [];
    for (const key of Object.keys(shape)) {
      const schema = shape[key];
      const childResult = schema[PARSE]((value as Record<string, any>)[key], [...path, key]);
      if (childResult.success) {
        if (childResult.data !== undefined) {
          result[key] = childResult.data;
        }
      } else {
        issues.push(...childResult.issues);
      }
    }
    if (issues.length) {
      return { success: false, issues };
    }
    return { success: true, data: result };
  };

  return createSchema<Record<string, any>>(parser);
}

export const z = {
  string,
  number,
  object,
  array,
  unknown,
};

export type { MiniZodError };
