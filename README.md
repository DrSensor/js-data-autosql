# js-data-autosql (WIP)
This is workaround enhancement for js-data-sql

## How to use

```javascript
import { SqlAdapter } from 'js-data-autosql'

let adapter = new SqlAdapter({
  knexOpts: {
    client: 'sqlite3',
    connection: {
      filename: './data.db'
    },
    useNullAsDefault: true
  },
  auto: {
    timestamp: true,  // default is true
    alterTable: true, // default is true
    arrayAs: {
      type: 'string', // the options is string and json
      delimiter: '\t'
    }
  }
})
```

## Feature

- [x] Auto create table
- [ ] Auto alter table
  - [x] add column
  - [ ] drop column
- [ ] Auto convert unsupported data type (useful when store array in sqlite or db that not support array)
  - [ ] as string (WIP)
  - [ ] as json[] or jsonb[]
- [x] Auto create timestamp (`created_at` and `updated_at`) in ISO format
- [ ] Auto create relationship (Foreign Key, etc)
  - [x] 1:1
  - [x] 1:M
- [ ] [Tested](https://github.com/js-data/js-data-adapter-tests)

## License
[MIT](./LICENSE)
