declare module "util" {
    export function inspect(obj: any, options?: Partial<{ depth: number | null; colors: boolean }>): string;
}
