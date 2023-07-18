import { Node } from 'acorn';
import * as estree from 'estree';
import * as periscopic from 'periscopic';

export type JSNode = Node;

export interface SvelteAST {
  script: JSNode;
  html: SvelteElement[];
}

export type SvelteElement =
  | (Omit<HTMLElement, 'children'> & {
      children?: SvelteElement[];
    })
  | SvelteExpression;

export interface SvelteExpression {
  type: 'Expression';
  expression: JSNode;
}

export interface HTMLElement {
  type: 'Element' | 'Text';
  name?: string;
  attributes: HTMLAttribute[];
  children?: HTMLElement[];
  text?: string;
}

export interface HTMLAttribute {
  type: 'Attribute';
  name: string;
  value: string | JSNode;
}

export function extractIdentifiers(node: estree.Node) {
  let result: estree.Identifier[] = [];
  switch (node.type) {
    case 'BinaryExpression':
      result = result.concat(
        ...extractIdentifiers(node.left),
        ...extractIdentifiers(node.right)
      );
      break;
    case 'UnaryExpression':
      result = result.concat(...extractIdentifiers(node.argument));
      break;
    case 'UpdateExpression':
      result = result.concat(...extractIdentifiers(node.argument));
      break;
    default:
      result = result.concat(...periscopic.extract_identifiers(node));
  }
  return result;
}

export function extractNames(node: estree.Node) {
  return extractIdentifiers(node).map((ident) => ident.name);
}
