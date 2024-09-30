This project distributes `hbs` files and `helpers.ts` that may be used to ease generating solidity documentation with `solidity-docgen'` for MKDocs.

To use this project

1. you must have `solidity-docgen` installed.
2. `git subtree add --prefix=docs/templates https://github.com/peeramid-labs/solidity-mkdocs  main`
3. configure in your `hardhat.config.ts` file:

```typescript
 docgen: {
    outputDir: './docs/contracts',
    pages: 'files',
    templates: 'docs/templates/src', // << This is the path to this project
    sourcesDir: './src',
    pageExtension: '.md',
    exclude: ['mocks', 'initializers', 'vendor', 'modifiers', 'fixtures'],
  },
  ```
