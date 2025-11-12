declare module 'prisma/config' {
  export function defineConfig(config: any): any;
  export function env(name: string): string;
}

declare module '@prisma/client' {
  // Allow TypeScript to find generated client types after `prisma generate` runs.
  const PrismaClient: any;
  export { PrismaClient };
  export default PrismaClient;
}
