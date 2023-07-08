import * as acorn from 'acorn';
import * as cheerio from 'cheerio';
import * as domhandler from 'domhandler';

import { HTMLAttribute, JSNode, SvelteAST, SvelteElement } from './ast.js';
import { ParseError } from './error.js';

export default class Parser {
  constructor(private readonly source: string) {}

  public parse(): SvelteAST {
    const $ = cheerio.load(this.source);

    const script: JSNode = parseScript($('script'));

    const html: SvelteElement[] = parseDOMChildren(
      $('body').children().toArray()
    );

    return { script, html } as SvelteAST;
  }
}

function parseScript(script: cheerio.Cheerio<cheerio.Element>): JSNode {
  if (script.length > 1) {
    throw new ParseError(
      'A component can only have one instance-level <script> element'
    );
  }
  return acorn.parse(script.html() as string, { ecmaVersion: 2022 });
}

function parseDOMChildren(elements: domhandler.ChildNode[]): SvelteElement[] {
  const children: SvelteElement[] = [];
  for (const element of elements) {
    const child = parseDOMNode(element);
    if (child) {
      children.push(child);
    }
  }
  return children;
}

function parseDOMNode(element: domhandler.ChildNode): SvelteElement | null {
  switch (element.constructor) {
    case domhandler.Element:
      return parseDOMElementNode(element as domhandler.Element);
    case domhandler.Text:
      return parseDOMTextNode(element as domhandler.Text);
    default:
      return null;
  }
}

function parseDOMElementNode(element: domhandler.Element): SvelteElement {
  const attributes: HTMLAttribute[] = [];
  for (const attribute in element.attribs) {
    attributes.push(
      parseDOMElementAttributes(attribute, element.attribs[attribute])
    );
  }
  const children: SvelteElement[] = parseDOMChildren(element.children);
  return {
    type: 'Element',
    name: element.name,
    attributes,
    children,
  } as SvelteElement;
}

function parseDOMElementAttributes(name: string, value: string): HTMLAttribute {
  const text = value.trim();
  const hasOpenBrace = text.startsWith('{');
  const hasCloseBrace = text.endsWith('}');
  if (hasOpenBrace && hasCloseBrace) {
    if (text.length === 2) {
      throw new ParseError(`Empty expression in attribute: ${value}`);
    }
    return {
      type: 'Attribute',
      name,
      value: acorn.parseExpressionAt(value.slice(1, value.length - 1), 0, {
        ecmaVersion: 2022,
      }),
    };
  } else if (hasOpenBrace) {
    throw new ParseError(
      `Unmatched opening brace in attribute value: ${value}`
    );
  } else if (hasCloseBrace) {
    throw new ParseError(
      `Unmatched closing brace in attribute value: ${value}`
    );
  } else {
    return {
      type: 'Attribute',
      name,
      value,
    };
  }
}

function parseDOMTextNode(element: domhandler.Text): SvelteElement {
  const text = element.data.trim();

  // split text into expressions and text
  const fragments = text.split(/({[^{}]*})/g);

  const hasExpression = fragments.some((frag) => {
    return frag.startsWith('{') || frag.endsWith('}');
  });

  if (hasExpression) {
    const children: SvelteElement[] = [];

    for (const frag of fragments) {
      if (!frag) {
        continue;
      }
      const hasOpenBrace = frag.startsWith('{');
      const hasCloseBrace = frag.endsWith('}');
      if (hasOpenBrace && hasCloseBrace) {
        children.push({
          type: 'Expression',
          expression: acorn.parseExpressionAt(
            frag.slice(1, frag.length - 1),
            0,
            {
              ecmaVersion: 2022,
            }
          ),
        });
      } else if (hasOpenBrace) {
        throw new ParseError(`Unmatched opening brace in text: ${text}`);
      } else if (hasCloseBrace) {
        throw new ParseError(`Unmatched closing brace in text: ${text}`);
      } else {
        children.push({
          type: 'Text',
          text: frag,
        } as SvelteElement);
      }
    }

    return {
      type: 'Element',
      name: 'div',
      attributes: [],
      children,
    };
  } else {
    return {
      type: 'Text',
      text,
    } as SvelteElement;
  }
}
