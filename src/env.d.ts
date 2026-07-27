/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly CONTENTFUL_SPACE_ID?: string
  readonly CONTENTFUL_ACCESS_TOKEN?: string
  readonly CONTENTFUL_ENVIRONMENT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
