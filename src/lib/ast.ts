import { Node } from 'acorn';

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
