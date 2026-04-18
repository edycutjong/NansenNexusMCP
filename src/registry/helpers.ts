import * as path from "node:path";
import { pathToFileURL } from "node:url";
import fastGlob from "fast-glob";

export function getModuleName(filePath: string): string {
  return path.basename(filePath, ".js");
}

export function getModuleType(filePath: string): string {
  return path.basename(path.dirname(filePath));
}

export function filePathToUrl(filePath: string): string {
  return pathToFileURL(filePath).href;
}

export function getModulePatterns(rootDir: string): Array<string> {
  return [
    path.join(rootDir, "tools", "*.js"),
    path.join(rootDir, "resources", "*.js"),
    path.join(rootDir, "prompts", "*.js"),
  ];
}

export function getRootDir(importMetaUrl: string): string {
  return path.dirname(path.dirname(new URL(importMetaUrl).pathname));
}

export function isSuccessfulResult(result: PromiseSettledResult<{ success: boolean }>): boolean {
  if (result.status === "rejected") return false;
  return result.value.success;
}

export function isFailedResult(result: PromiseSettledResult<{ success: boolean }>): boolean {
  if (result.status === "rejected") return true;
  return !result.value.success;
}

export function countResults(
  results: Array<PromiseSettledResult<{ success: boolean }>>
): { successful: number; failed: number } {
  const successful = results.filter(isSuccessfulResult).length;
  const failed = results.filter(isFailedResult).length;
  return { successful, failed };
}

export function formatRegistrationSummary(successful: number, failed: number): string {
  return `\nRegistration complete: ${String(successful)} successful, ${String(failed)} failed`;
}

export function formatModuleInfo(moduleType: string, moduleName: string): string {
  return `${moduleType}/${moduleName}`;
}

export type ModuleLoadResult = {
  success: boolean;
  name: string;
  type?: string;
  error?: unknown;
};

export async function loadModule(filePath: string): Promise<{ default?: unknown }> {
  const fileUrl = filePathToUrl(filePath);
  /* c8 ignore next */
  return await import(fileUrl) as { default?: unknown };
}

export function logModuleLoading(moduleType: string, moduleName: string): void {
  console.error(`Loading ${formatModuleInfo(moduleType, moduleName)}...`);
}

export function logModuleSuccess(type: string, name: string): void {
  console.error(`✓ Registered ${type}: ${name}`);
}

export function logModuleError(moduleName: string, error: string): void {
  console.error(`✗ Module ${moduleName} ${error}`);
}

export function logLoadError(moduleName: string, error: unknown): void {
  console.error(`✗ Failed to load ${moduleName}:`, error);
}

export function logFoundFiles(count: number): void {
  console.error(`Found ${String(count)} module files to register`);
}

export function logAutoRegistering(patterns: Array<string>): void {
  console.error("Auto-registering modules from:", patterns);
}

export function logFailedModules(results: Array<PromiseSettledResult<ModuleLoadResult>>): void {
  console.error("Failed modules:");
  results.filter(isFailedResult).forEach((result) => {
    if (result.status === "rejected") {
      console.error(`  - Error: ${String(result.reason)}`);
      return;
    }
    
    if (!result.value.success) {
      console.error(`  - ${result.value.name}: ${String(result.value.error)}`);
    }
  });
}

export async function findModuleFiles(rootDir: string): Promise<Array<string>> {
  const patterns = getModulePatterns(rootDir);
  logAutoRegistering(patterns);
  
  const files = await fastGlob(patterns, {
    absolute: true,
    onlyFiles: true,
  });
  
  logFoundFiles(files.length);
  return files;
}

export function createSuccessResult(name: string, type: string): ModuleLoadResult {
  return { success: true, name, type };
}

export function createErrorResult(name: string, error: unknown): ModuleLoadResult {
  return { success: false, name, error };
}
