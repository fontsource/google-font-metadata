export interface APIResponse {
    family: string;
    variants: string[];
    subsets: string[];
    version: string;
    lastModified: string;
    category: string;
}
export interface GotResponse {
    items: APIResponse[];
}
export declare const fetchAPI: (url: string) => Promise<void>;
