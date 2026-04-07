import { builtinRules } from "eslint/use-at-your-own-risk";

const baseNoUnusedVarsRule = builtinRules.get("no-unused-vars");
const commaFilter = { filter: (token) => token.value === "," };
const includeCommentsFilter = { includeComments: true };

function createUnusedImportFix(parent, sourceCode) {
  return {
    fix(fixer) {
      const grandParent = parent.parent;
      if (!grandParent) {
        return null;
      }

      if (grandParent.specifiers.length === 1) {
        const nextToken = sourceCode.getTokenAfter(
          grandParent,
          includeCommentsFilter,
        );
        const newLinesBetween = nextToken
          ? nextToken.loc.start.line - grandParent.loc.start.line
          : 0;
        const endOfReplaceRange = nextToken
          ? nextToken.range[0]
          : grandParent.range[1];
        const count = Math.max(0, newLinesBetween - 1);

        return [
          fixer.remove(grandParent),
          fixer.replaceTextRange(
            [grandParent.range[1], endOfReplaceRange],
            "\n".repeat(count),
          ),
        ];
      }

      if (
        parent !== grandParent.specifiers[grandParent.specifiers.length - 1]
      ) {
        const comma = sourceCode.getTokenAfter(parent, commaFilter);
        const previousNode = sourceCode.getTokenBefore(parent);

        return [
          fixer.removeRange([previousNode.range[1], parent.range[0]]),
          fixer.remove(parent),
          fixer.remove(comma),
        ];
      }

      if (
        grandParent.specifiers.filter(
          (specifier) => specifier.type === "ImportSpecifier",
        ).length === 1
      ) {
        const start = sourceCode.getTokenBefore(parent, commaFilter);
        const end = sourceCode.getTokenAfter(parent, {
          filter: (token) => token.value === "}",
        });

        return fixer.removeRange([start.range[0], end.range[1]]);
      }

      return fixer.removeRange([
        sourceCode.getTokenBefore(parent, commaFilter).range[0],
        parent.range[1],
      ]);
    },
  };
}

function buildPredicate(problem, context) {
  const sourceCode = context.sourceCode || context.getSourceCode();
  const node =
    problem.node ||
    sourceCode.getNodeByRangeIndex(
      sourceCode.getIndexFromLoc(problem.loc.start),
    );

  if (!node?.parent) {
    return false;
  }

  const parent = node.parent;
  if (!/^Import(|Default|Namespace)Specifier$/.test(parent.type)) {
    return false;
  }

  return {
    ...problem,
    ...createUnusedImportFix(parent, sourceCode),
  };
}

const svelteUnusedImportsRule = {
  ...baseNoUnusedVarsRule,
  meta: {
    ...baseNoUnusedVarsRule.meta,
    fixable: "code",
  },
  create(context) {
    return baseNoUnusedVarsRule.create(
      Object.create(context, {
        report: {
          enumerable: true,
          value(problem) {
            const nextProblem = buildPredicate(problem, context);
            if (nextProblem) {
              context.report(nextProblem);
            }
          },
        },
      }),
    );
  },
};

export default {
  meta: {
    name: "svelte-unused-imports",
  },
  rules: {
    "no-unused-imports": svelteUnusedImportsRule,
  },
};
