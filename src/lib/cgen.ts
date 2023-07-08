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
        ${escodegen.generate(this.ast.script)}
        const lifecycle = {
          create(target) {
            ${this.createStmts.join('\n')}
          },
          update(changed) {
            ${this.updateStmts.join('\n')}
          },
          destroy(target) {
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
        const expression = escodegen.generate(node.expression as JSNode);
        const identifiers = extractNames(node.expression as estree.Node);
        this.variables.push(variableName);
        this.createStmts.push(
          `${variableName} = document.createTextNode(${expression})`
        );
        this.createStmts.push(`${parentNodeName}.appendChild(${variableName})`);
        this.destroyStmts.push(
          `${parentNodeName}.removeChild(${variableName})`
        );
        const reactive = [...identifiers].filter((ident) =>
          this.semantic.reactive.has(ident)
        );
        if (reactive.length > 0) {
          const updateCondition = reactive.slice(1).reduce((acc, ident) => {
            return `${acc} || changed.includes('${ident}')`;
          }, `changed.includes('${reactive[0]}')`);
          this.updateStmts.push(
            `if (${updateCondition}) ${variableName}.textContent = ${expression}`
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
          if (outerThis.shouldLifecycleUpdate(argument, currentScope)) {
            this.replace(
              outerThis.generateLifecycleUpdate(node, argument.name)
            );
            this.skip();
          }
        }
        if (node.type === 'AssignmentExpression') {
          const left = node.left as estree.Identifier;
          if (outerThis.shouldLifecycleUpdate(left, currentScope)) {
            this.replace(outerThis.generateLifecycleUpdate(node, left.name));
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
  }

  private shouldLifecycleUpdate(
    node: estree.Identifier,
    currentScope: periscopic.Scope
  ): boolean {
    return (
      currentScope.find_owner(node.name) === this.semantic.root &&
      this.semantic.referred.has(node.name)
    );
  }

  private generateLifecycleUpdate(node: estree.Expression, name: string) {
    const lifecycleUpdate = {
      type: 'SequenceExpression',
      expressions: [
        node,
        acorn.parseExpressionAt(`lifecycle.update(['${name}'])`, 0, {
          ecmaVersion: 2022,
        }) as estree.Expression,
      ],
    } as estree.Node;
    return lifecycleUpdate;
  }
}

class Mangler {
  private counter = 0;

  public mangle(name: string): string {
    const newName = `${name}_${this.counter++}`;
    return newName;
  }
}
