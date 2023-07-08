import * as fs from 'node:fs/promises';
import * as process from 'node:process';

import { Command } from 'commander';

import CodeGenerator from './lib/cgen.js';
import Parser from './lib/parser.js';
import SemanticAnalyser from './lib/semantic.js';

async function main() {
  const program = new Command();
  program.name('sveltoy').description('A toy Svelte compiler').version('0.1.0');
  program.option('-o, --output <file>', 'output file');
  program.option('-a, --emit-ast', 'emit AST');
  program.option('-s, --emit-semantic', 'emit semantic analysis');
  program.argument('<file>', 'input file');
  program.parse(process.argv);

  const filename = program.args[0];
  const options = program.opts();

  const source = await fs.readFile(filename, 'utf-8');
  const ast = new Parser(source).parse();
  if (options.emitAst) {
    console.log(JSON.stringify(ast, null, 2));
    process.exit(0);
  }

  const semantic = new SemanticAnalyser(ast).analyze();
  if (options.emitSemantic) {
    console.log(JSON.stringify(semantic.dump(), null, 2));
    process.exit(0);
  }

  const code = new CodeGenerator(ast, semantic).generate();
  await fs.writeFile(options.output ?? 'a.js', code, 'utf-8');
}

main();
