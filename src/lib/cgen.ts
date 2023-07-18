import * as acorn from 'acorn';
import * as escodegen from 'escodegen';
import * as estree from 'estree';
import * as estreewalker from 'estree-walker';
import * as periscopic from 'periscopic';

import {
  extractNames,
  HTMLAttribute,
  JSNode,
  SvelteAST,
  SvelteElement,
} from './ast.js';
import { SvelteSemantic } from './semantic.js';

export default class CodeGenerator {
  private readonly variables: string[] = [];
  private readonly createStmts: string[] = [];
  private readonly updateStmts: string[] = [];
  private readonly destroyStmts: string[] = [];
  private readonly mangler = new Mangler();

  constructor(
    private readonly ast: SvelteAST,
    private readonly semantic: SvelteSemantic
  ) {}

  public generate(): string {
    this.ast.html.forEach((node) => this.generateHTML(node, 'target'));
    this.generateScript();
    return `
      export default function () {
        ${this.variables.map((variable) => `let ${variable};`).join('\n')}
        ${[...this.semantic.assignees].map((item) => `let ${item};`).join('\n')}
        ${escodegen.generate(this.ast.script)}
        const lifecycle = {
          create: function(target) {
            ${this.createStmts.join('\n')}
          },
          update: function(changed) {
            ${this.updateStmts.join('\n')}
          },
          destroy: function(target) {
            ${this.destroyStmts.join('\n')}
          },
        }
        return lifecycle;
      }
    `;
  }

  private generateHTML(node: SvelteElement, parentNodeName: string) {
    switch (node.type) {
      case 'Element': {
        const variableName = this.mangler.mangle(node.name as string);
        this.variables.push(variableName);
        this.createStmts.push(
          `${variableName} = document.createElement('${node.name}')`
        );
        node.attributes.forEach((attribute) =>
          this.generateHTMLAttribute(variableName, attribute)
        );
        node.children?.forEach((child) =>
          this.generateHTML(child, variableName)
        );
        this.createStmts.push(`${parentNodeName}.appendChild(${variableName})`);
        this.destroyStmts.push(
          `${parentNodeName}.removeChild(${variableName})`
        );
        break;
      }
      case 'Text': {
        const variableName = this.mangler.mangle('txt');
        this.variables.push(variableName);
        this.createStmts.push(
          `${variableName} = document.createTextNode('${node.text}')`
        );
        this.createStmts.push(`${parentNodeName}.appendChild(${variableName})`);
        this.destroyStmts.push(
          `${parentNodeName}.removeChild(${variableName})`
        );
        break;
      }
      case 'Expression': {
        const variableName = this.mangler.mangle('exp');
        const updateExpression = escodegen.generate(node.expression as JSNode);
        const identifiers = extractNames(node.expression as estree.Node);
        this.variables.push(variableName);
        this.createStmts.push(
          `${variableName} = document.createTextNode(${updateExpression})`
        );
        this.createStmts.push(`${parentNodeName}.appendChild(${variableName})`);
        this.destroyStmts.push(
          `${parentNodeName}.removeChild(${variableName})`
        );
        const reactive = [...identifiers].filter((ident) =>
          this.semantic.reactive.has(ident)
        );
        if (reactive.length > 0) {
          const updateCondition = generateLifecycleUpdateCondition(reactive);
          reactive.slice(1).reduce((acc, ident) => {
            return `${acc} || changed.includes('${ident}')`;
          }, `changed.includes('${reactive[0]}')`);
          this.updateStmts.push(
            `if (${updateCondition}) ${variableName}.textContent = JSON.stringify(${updateExpression})`
          );
        }
        break;
      }
    }
  }

  private generateHTMLAttribute(nodeName: string, attribute: HTMLAttribute) {
    if (attribute.name.startsWith('on:')) {
      const eventName = attribute.name.slice(3);
      const handlerName = escodegen.generate(attribute.value as JSNode);
      this.createStmts.push(
        `${nodeName}.addEventListener('${eventName}', ${handlerName})`
      );
      this.destroyStmts.push(
        `${nodeName}.removeEventListener('${eventName}', ${handlerName})`
      );
    } else {
      const value =
        typeof attribute.value === 'string'
          ? attribute.value
          : escodegen.generate(attribute.value as JSNode);
      this.createStmts.push(
        `${nodeName}.setAttribute('${attribute.name}', '${value}')`
      );
    }
  }

  private generateScript() {
    let currentScope = this.semantic.root;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const outerThis = this;
    estreewalker.walk(this.ast.script as unknown as estree.Program, {
      enter(node) {
        if (outerThis.semantic.map.has(node)) {
          currentScope = outerThis.semantic.map.get(node) as periscopic.Scope;
        }
        if (node.type === 'UpdateExpression') {
          const argument = node.argument as estree.Identifier;
          const targets = outerThis.findLifecycleUpdateTarget(
            argument,
            currentScope
          );
          if (targets.length > 0) {
            this.replace(generateLifecycleUpdate(targets, node));
            this.skip();
          }
        }
        if (node.type === 'AssignmentExpression') {
          const left = node.left as estree.Identifier;
          const targets = outerThis.findLifecycleUpdateTarget(
            left,
            currentScope
          );
          if (targets.length > 0) {
            this.replace(generateLifecycleUpdate(targets, node));
            this.skip();
          }
        }
      },
      leave(node) {
        if (outerThis.semantic.map.has(node)) {
          currentScope = currentScope.parent as periscopic.Scope;
        }
      },
    });

    for (const { dependencies, assignees, expression } of this.semantic
      .responsive) {
      if (dependencies) {
        const updateCondition = generateLifecycleUpdateCondition([
          ...dependencies,
        ]);
        let updateExpression = escodegen.generate(expression as JSNode);
        if (assignees) {
          updateExpression += `; ${escodegen.generate(
            generateLifecycleUpdate([...assignees])
          )}; `;
        }
        this.createStmts.push(updateExpression);
        this.updateStmts.push(
          `if (${updateCondition}) { ${updateExpression} }`
        );
      }
    }
  }

  private findLifecycleUpdateTarget(
    node: estree.Identifier,
    currentScope: periscopic.Scope
  ): string[] {
    const names = extractNames(node);
    return names.filter((name) => {
      return (
        currentScope.find_owner(name) === this.semantic.root &&
        this.semantic.reactive.has(name)
      );
    });
  }
}

function generateLifecycleUpdate(names: string[], prefix?: estree.Expression) {
  const updateExpression = acorn.parseExpressionAt(
    `lifecycle.update([${names.map((name) => `'${name}', `)}])`,
    0,
    {
      ecmaVersion: 2022,
    }
  ) as estree.Expression;

  const lifecycleUpdate = {
    type: 'SequenceExpression',
    expressions: prefix ? [prefix, updateExpression] : [updateExpression],
  } as estree.Node;
  return lifecycleUpdate;
}

function generateLifecycleUpdateCondition(arr: string[]) {
  return arr.slice(1).reduce((acc, ident) => {
    return `${acc} || changed.includes('${ident}')`;
  }, `changed.includes('${arr[0]}')`);
}

class Mangler {
  private counter = 0;

  public mangle(name: string): string {
    const newName = `${name}_${this.counter++}`;
    return newName;
  }
}
