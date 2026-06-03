import fs from "fs";
import path from "path";

const rootDir = process.cwd();

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes("node_modules") && !file.includes(".git") && !file.includes("ecommerce_frontend")) {
        results = results.concat(walkDir(file));
      }
    } else {
      if (file.endsWith(".js") || file.endsWith(".json") || file.endsWith(".md") || file.endsWith(".yaml")) {
        results.push(file);
      }
    }
  });
  return results;
}

function analyzeFile(filePath) {
  const relativePath = path.relative(rootDir, filePath);
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const numLines = lines.length;

  const fileType = relativePath.split(path.sep)[0];
  let details = "";

  if (fileType === "models") {
    // Extract mongoose schemas or field names
    const schemaMatches = [...content.matchAll(/(\w+)\s*:\s*{\s*type\s*:/g)];
    if (schemaMatches.length > 0) {
      const fields = [...new Set(schemaMatches.map(m => m[1]))];
      details = `**Fields**: ${fields.join(", ")}`;
    } else {
      // Alternate check for simpler schemas
      const simpleMatches = [...content.matchAll(/(\w+)\s*:\s*(String|Number|Boolean|Date|ObjectId|\[|{)/g)];
      const fields = [...new Set(simpleMatches.map(m => m[1]))];
      if (fields.length > 0) {
        details = `**Fields**: ${fields.join(", ")}`;
      }
    }
  } else if (fileType === "routes") {
    // Extract HTTP endpoints like router.get("/...", ...) or router.post(...)
    const routeMatches = [...content.matchAll(/router\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']/g)];
    if (routeMatches.length > 0) {
      const routes = routeMatches.map(m => `\`${m[1].toUpperCase()} ${m[2]}\``);
      details = `**Endpoints**: ${routes.join(", ")}`;
    }
  } else if (fileType === "controllers") {
    // Extract exported functions
    const funcMatches = [...content.matchAll(/export\s+(const|async\s+function|function)\s+(\w+)/g)];
    if (funcMatches.length > 0) {
      const funcs = funcMatches.map(m => m[2]);
      details = `**Handlers**: ${funcs.map(f => `\`${f}\``).join(", ")}`;
    }
  } else if (fileType === "middleware") {
    const funcMatches = [...content.matchAll(/export\s+(const|async\s+function|function)\s+(\w+)/g)];
    if (funcMatches.length > 0) {
      const funcs = funcMatches.map(m => m[2]);
      details = `**Middleware**: ${funcs.map(f => `\`${f}\``).join(", ")}`;
    }
  }

  return {
    path: relativePath,
    lines: numLines,
    type: fileType,
    details: details
  };
}

const files = walkDir(rootDir);
const analysis = files.map(analyzeFile);

// Group by folder type
const groups = {};
analysis.forEach(item => {
  const group = item.type || "root";
  if (!groups[group]) {
    groups[group] = [];
  }
  groups[group].push(item);
});

let markdown = `# Codebase Overview: Backend E-Commerce\n\n`;
markdown += `This document provides an overview of all files in the backend e-commerce project. You can click on the file links to view their implementation.\n\n`;

Object.keys(groups).sort().forEach(group => {
  markdown += `## ${group.toUpperCase()}\n\n`;
  markdown += `| File Path | Lines | Details |\n`;
  markdown += `| :--- | :--- | :--- |\n`;
  groups[group].forEach(item => {
    markdown += `| [${path.basename(item.path)}](file:///${path.join(rootDir, item.path)}) | ${item.lines} | ${item.details || "-"} |\n`;
  });
  markdown += `\n`;
});

fs.writeFileSync(path.join(rootDir, "codebase_overview.md"), markdown);
console.log("Successfully generated codebase_overview.md");
