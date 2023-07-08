import * as fs from 'node:fs';
import * as process from 'node:process';

import CodeGenerator from './lib/cgen.js';
import Parser from './lib/parser.js';
import SemanticAnalyser from './lib/semantic.js';

const filename = process.argv[2];
const content = fs.readFileSync(filename, 'utf-8');

const ast = new Parser(content).parse();

const semantic = new SemanticAnalyser(ast).analyze();

const code = new CodeGenerator(ast, semantic).generate();

console.log(code);
