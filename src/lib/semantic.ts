import * as estree from 'estree';
import * as estreewalker from 'estree-walker';
import * as periscopic from 'periscopic';

import { extractNames, SvelteAST, SvelteElement } from './ast.js';

export class SvelteSemantic {
  constructor(
    public readonly globals: Set<string>,
    public readonly reactive: Set<string>,
    public readonly referred: Set<string>,
    public readonly root: periscopic.Scope,
    public readonly map: WeakMap<estree.Node, periscopic.Scope>
  ) {}

  public dump() {
    return {
      globals: [...this.globals],
      reactive: [...this.reactive],
      referred: [...this.referred],
    };
  }
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

    return new SvelteSemantic(globals, reactive, referred, rootScope, map);
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
        const names = extractNames(argument);
        for (const name of names) {
          if (currentScope.find_owner(name) === rootScope) {
            reactive.add(name);
          }
        }
      }
      if (node.type === 'AssignmentExpression') {
        const left = node.left as estree.Identifier;
        const names = extractNames(left);
        for (const name of names) {
          if (currentScope.find_owner(name) === rootScope) {
            reactive.add(name);
          }
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
            ...extractNames(attribute.value as estree.Node),
          ]);
        }
      });
      break;
    case 'Expression':
      referred = new Set(extractNames(node.expression as estree.Node));
      break;
  }
  return referred;
}
