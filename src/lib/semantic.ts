import * as estree from 'estree';
import * as estreewalker from 'estree-walker';
import * as periscopic from 'periscopic';

import { SvelteAST, SvelteElement } from './ast.js';

export interface SvelteSemantic {
  globals: Set<string>;
  reactive: Set<string>;
  referred: Set<string>;
  root: periscopic.Scope;
  map: WeakMap<estree.Node, periscopic.Scope>;
}

export default class SemanticAnalyser {
  constructor(private readonly ast: SvelteAST) {}

  public analyze(): SvelteSemantic {
    const { scope: rootScope, map } = periscopic.analyze(
      this.ast.script as unknown as estree.Program
    );

    const globals = new Set(rootScope.declarations.keys());

    const reactive = traverseScriptAST(
      this.ast.script as unknown as estree.Program,
      rootScope,
      map
    );

    let referred = new Set<string>();
    this.ast.html.forEach(
      (element) =>
        (referred = new Set([...referred, ...traverseHTMLAST(element)]))
    );

    return {
      globals,
      reactive,
      referred,
      root: rootScope,
      map,
    };
  }
}

function traverseScriptAST(
  script: estreewalker.Node,
  rootScope: periscopic.Scope,
  map: WeakMap<estreewalker.Node, periscopic.Scope>
) {
  const reactive = new Set<string>();
  let currentScope = rootScope;
  estreewalker.walk(script, {
    enter(node) {
      if (map.has(node)) {
        currentScope = map.get(node) as periscopic.Scope;
      }
      if (node.type === 'UpdateExpression') {
        const argument = node.argument as estree.Identifier;
        if (currentScope.find_owner(argument.name) === rootScope) {
          reactive.add(argument.name);
        }
      }
      if (node.type === 'AssignmentExpression') {
        const left = node.left as estree.Identifier;
        if (currentScope.find_owner(left.name) === rootScope) {
          reactive.add(left.name);
        }
      }
    },
    leave(node) {
      if (map.has(node)) {
        currentScope = currentScope.parent as periscopic.Scope;
      }
    },
  });
  return reactive;
}

function traverseHTMLAST(node: SvelteElement) {
  let referred = new Set<string>();
  switch (node.type) {
    case 'Element':
      node.children?.forEach(
        (child) =>
          (referred = new Set([...referred, ...traverseHTMLAST(child)]))
      );
      node.attributes.forEach((attribute) => {
        if (typeof attribute.value != 'string') {
          referred = new Set([
            ...referred,
            ...periscopic.extract_names(attribute.value as estree.Expression),
          ]);
        }
      });
      break;
    case 'Expression':
      referred = new Set(
        periscopic.extract_names(node.expression as estree.Expression)
      );
      break;
  }
  return referred;
}