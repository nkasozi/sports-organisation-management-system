const ALLOWED_COMMENT_PREFIXES = [
  "eslint-",
  "eslint ",
  "global ",
  "@ts-",
  "prettier-ignore",
  "svelte-ignore",
];
const RESULT_SUCCESS_PROPERTY = "success";
const RESULT_PAYLOAD_PROPERTIES = ["data", "error"];

function is_tooling_directive(comment) {
  const trimmed_text = comment.value.trim();
  return ALLOWED_COMMENT_PREFIXES.some((prefix) =>
    trimmed_text.startsWith(prefix),
  );
}

/** @type {import("eslint").Rule.RuleModule} */
const no_code_comments_rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "R2: no code comments; rename or extract instead. Tooling directives are allowed.",
    },
    schema: [],
    messages: {
      remove_comment:
        "R2: remove this comment; express the intent through names instead.",
    },
  },
  create(context) {
    return {
      Program() {
        context.sourceCode
          .getAllComments()
          .filter((comment) => !is_tooling_directive(comment))
          .forEach((comment) =>
            context.report({ loc: comment.loc, messageId: "remove_comment" }),
          );
      },
    };
  },
};

function constituent_types(type) {
  return type.isUnion() ? type.types : [type];
}

function is_result_type(type) {
  const constituents = constituent_types(type);
  const every_constituent_has_success = constituents.every((constituent) =>
    Boolean(constituent.getProperty(RESULT_SUCCESS_PROPERTY)),
  );
  const some_constituent_has_payload = constituents.some((constituent) =>
    RESULT_PAYLOAD_PROPERTIES.some((property_name) =>
      Boolean(constituent.getProperty(property_name)),
    ),
  );
  return every_constituent_has_success && some_constituent_has_payload;
}

function unwrap_discarded_expression(expression) {
  switch (expression.type) {
    case "AwaitExpression":
      return expression.argument;
    case "UnaryExpression":
      return expression.operator === "void" ? expression.argument : expression;
    default:
      return expression;
  }
}

/** @type {import("eslint").Rule.RuleModule} */
const no_ignored_result_rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "R4: a Result or AsyncResult must be inspected; discarding it hides failures.",
    },
    schema: [],
    messages: {
      handle_result:
        "R4: this Result is discarded. Check `.success` and handle the failure (log it and surface it to the user).",
    },
  },
  create(context) {
    const services = context.sourceCode.parserServices;
    if (!services || !services.program) return {};
    const checker = services.program.getTypeChecker();
    return {
      ExpressionStatement(node) {
        const discarded_expression = unwrap_discarded_expression(
          node.expression,
        );
        if (discarded_expression.type !== "CallExpression") return;
        const expression_type =
          services.getTypeAtLocation(discarded_expression);
        const settled_type =
          checker.getAwaitedType(expression_type) ?? expression_type;
        if (!is_result_type(settled_type)) return;
        context.report({ node, messageId: "handle_result" });
      },
    };
  },
};

function contains_await(node) {
  if (!node || typeof node !== "object") return false;
  if (node.type === "AwaitExpression") return true;
  const is_nested_function =
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression" ||
    node.type === "FunctionDeclaration";
  if (is_nested_function) return false;
  return Object.entries(node).some(
    ([key, value]) =>
      key !== "parent" &&
      (Array.isArray(value)
        ? value.some((item) => contains_await(item))
        : contains_await(value)),
  );
}

function read_assigned_name(node) {
  return node.type === "Identifier" ? node.name : "";
}

/** @type {import("eslint").Rule.RuleModule} */
const no_stale_spread_across_await_rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Spreading a variable into its own reassignment captures it before a later await, silently discarding updates made while waiting.",
    },
    schema: [],
    messages: {
      stale_spread:
        "`{{name}}` is spread before an await in the same object, so changes made while awaiting are overwritten. Await first, then spread the current value.",
    },
  },
  create(context) {
    return {
      AssignmentExpression(node) {
        const assigned_name = read_assigned_name(node.left);
        if (!assigned_name || node.right.type !== "ObjectExpression") return;
        const properties = node.right.properties;
        const self_spread_index = properties.findIndex(
          (property) =>
            property.type === "SpreadElement" &&
            read_assigned_name(property.argument) === assigned_name,
        );
        if (self_spread_index < 0) return;
        const awaits_after_spread = properties
          .slice(self_spread_index + 1)
          .some((property) => contains_await(property));
        if (!awaits_after_spread) return;
        context.report({
          node,
          messageId: "stale_spread",
          data: { name: assigned_name },
        });
      },
    };
  },
};

/** @type {import("eslint").ESLint.Plugin} */
const code_quality_plugin = {
  meta: { name: "code-quality" },
  rules: {
    "no-code-comments": no_code_comments_rule,
    "no-ignored-result": no_ignored_result_rule,
    "no-stale-spread-across-await": no_stale_spread_across_await_rule,
  },
};

export default code_quality_plugin;
