import * as estree from 'estree';
import * as estreewalker from 'estree-walker';
import * as periscopic from 'periscopic';

import { extractNames, SvelteAST, SvelteElement } from './ast.js';

export class SvelteSemantic {
  constructor(
    public readonly globals: Set<string>,
    public readonly reactive: Set<string>,
    public readonly referred: Set<string>,
    public readonly assignees: Set<string>,
    public readonly responsive: Set<SvelteResponsive>,
    public readonly root: periscopic.Scope,
    public readonly map: WeakMap<estree.Node, periscopic.Scope>
  ) {}

  public dump() {
    return {
      globals: [...this.globals],
      reactive: [...this.reactive],
      referred: [...this.referred],
      assignees: [...this.assignees],
      responsive: [...this.responsive].map((item) => ({
        assignees: [...item.assignees],
        dependencies: [...item.dependencies],
        expression: item.expression,
      })),
    };
  }
}

export interface SvelteResponsive {
  assignees: Set<string>;
  dependencies: Set<string>;
  expression: estree.Statement;
}

export default class SemanticAnalyser {
  constructor(private readonly ast: SvelteAST) {}

  public analyze(): SvelteSemantic {
    const { program, labeled } = splitScriptAST(
      this.ast.script as unknown as estree.Program
    );

    const { scope: rootScope, map } = periscopic.analyze(program);
    const scriptGlobals = new Set(rootScope.declarations.keys());

    const scriptReactive = traverseScriptAST(program, rootScope, map);
    const { responsive, reactive, globals, assignees } = traverseResponsiveAST(
      labeled,
      scriptReactive,
      scriptGlobals
    );

    let referred = new Set<string>();
    this.ast.html.forEach(
      (element) =>
        (referred = new Set([...referred, ...traverseHTMLAST(element)]))
    );

    return new SvelteSemantic(
      globals,
      reactive,
      referred,
      assignees,
      responsive,
      rootScope,
      map
    );
  }
}

function splitScriptAST(program: estree.Program) {
  const labeled = program.body.filter(
    (node) => node.type === 'LabeledStatement' && node.label.name === '$'
  ) as estree.LabeledStatement[];

  program.body = program.body.filter(
    (node) => node.type !== 'LabeledStatement' || node.label.name !== '$'
  );

  return { program, labeled };
}

function traverseResponsiveAST(
  labeled: estree.LabeledStatement[],
  scriptReactive: Set<string>,
  scriptGlobals: Set<string>
) {
  let assignees = new Set<string>();
  const responsive = new Set<SvelteResponsive>();
  let reactive = scriptReactive;
  let globals = scriptGlobals;
  for (const node of labeled) {
    const body = node.body;
    if (
      body.type === 'ExpressionStatement' &&
      body.expression.type === 'AssignmentExpression'
    ) {
      const lefts = extractNames(body.expression.left);
      const rights = extractNames(body.expression.right);
      assignees = new Set([
        ...assignees,
        ...lefts.filter((item) => !reactive.has(item)),
      ]);
      reactive = new Set([...reactive, ...assignees]);
      globals = new Set([...globals, ...lefts]);
      responsive.add({
        assignees: new Set(lefts),
        dependencies: new Set(rights.filter((name) => reactive.has(name))),
        expression: body,
      });
    }
  }

  for (const node of labeled) {
    const body = node.body;
    if (
      body.type !== 'ExpressionStatement' ||
      body.expression.type !== 'AssignmentExpression'
    ) {
      const { scope: rootScope, map } = periscopic.analyze(body);

      const dependencies: Set<string> = new Set();
      let currentScope = rootScope;
      const currentAssignees = new Set<string>();
      estreewalker.walk(body, {
        enter(node) {
          if (map.has(node)) {
            currentScope = map.get(node) as periscopic.Scope;
          }
          if (node.type === 'UpdateExpression') {
            const argument = node.argument as estree.Identifier;
            const names = extractNames(argument);
            for (const name of names) {
              if (currentScope.find_owner(name) === null && globals.has(name)) {
                reactive.add(name);
                currentAssignees.add(name);
              }
            }
          } else if (node.type === 'AssignmentExpression') {
            const left = node.left as estree.Identifier;
            const names = extractNames(left);
            for (const name of names) {
              if (currentScope.find_owner(name) === null && globals.has(name)) {
                reactive.add(name);
                currentAssignees.add(name);
              }
            }
            const rights = extractNames(node.right);
            for (const name of rights) {
              if (currentScope.find_owner(name) === null && globals.has(name)) {
                dependencies.add(name);
              }
            }
          } else if (node.type.endsWith('Expression')) {
            const names = extractNames(node);
            for (const name of names) {
              if (rootScope.find_owner(name) === null && globals.has(name)) {
                dependencies.add(name);
              }
            }
          }
        },
      });
      responsive.add({
        assignees: currentAssignees,
        dependencies,
        expression: body,
      });
    }
  }
  return { responsive, reactive, globals, assignees };
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
