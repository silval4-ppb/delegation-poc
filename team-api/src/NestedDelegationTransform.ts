/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import type { Transform, DelegationContext } from "@graphql-tools/delegate";
import type { ExecutionRequest, ExecutionResult } from "@graphql-tools/utils";
import type { DocumentNode, FieldNode } from "graphql";
import { visit, Kind } from "graphql";

/**
 * Nested field delegation transform.
 *
 * i.e.:
 * ```
 * await delegateToSchema({
 *   schema: subschema,
 *   operation: 'query',
 *   fieldName: 'some.nested.field',
 *   context,
 *   info,
 *   transforms: [new NestedDelegationTransform()],
 * })
 * ```
 */
class NestedDelegationTransform implements Transform {
  /**
   * Transform document to open nested field (containing `.`).
   */
  transformRequest(request: ExecutionRequest) {
    const document: DocumentNode = visit(request.document, {
      [Kind.FIELD]: {
        enter: (node) => {
          const path = node.name.value.split(".");

          // Skip when not nested field name.
          if (path.length === 1) {
            return node;
          }

          const first = path[0];
          const rest = path.slice(1).join(".");

          const child: FieldNode = {
            ...node,
            name: { ...node.name, value: rest },
          };
          const parent: FieldNode = {
            ...node,
            name: { ...node.name, value: first },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [child],
            },
          };

          return parent;
        },
      },
    });

    return { ...request, document };
  }

  /**
   * Transform result data by reconstructing nested field (containing `.`).
   */
  transformResult(result: ExecutionResult, delegation: DelegationContext) {
    // Safeguard for query execution errors.
    if (!result.data) {
      return result;
    }

    const path = delegation.fieldName.split(".");

    const value = path.reduce((curr, name) => {
      const nested = curr[name];

      // No result, stop traversing.
      if (typeof nested === "undefined" || nested === null) return null;

      // If is an array, simply get first element (how to handle this?)
      if (Array.isArray(nested)) return nested[0];

      return nested;
    }, result.data);

    return { ...result, data: { [delegation.fieldName]: value } };
  }
}

export { NestedDelegationTransform };
