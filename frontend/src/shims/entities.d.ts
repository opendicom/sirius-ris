//Ignore the specific type of 'entities/decode':
declare module 'entities/decode' {
    export interface EntityDecoder {
        decodeEntity: (input: string) => string;
    }
}