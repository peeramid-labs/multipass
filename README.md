This project distributes `hbs` files and `helpers.ts` that may be used to ease generating solidity documentation with `solidity-docgen'` for MKDocs.

To use this project, you must have `solidity-docgen` installed.

Simply configure in your `hardhat.config.ts` file:

```typescript
 docgen: {
    outputDir: './docs/contracts',
    pages: 'files',
    templates: 'node_modules/@peeramid-labs/solidity-mkdocs', // << This is the path to this project
    sourcesDir: './src',
    pageExtension: '.md',
    exclude: ['mocks', 'initializers', 'vendor', 'modifiers', 'fixtures'],
  },
  ```
