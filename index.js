/*

MIT License

Copyright (c) 2017-2018 Fahmi Akbar Wildana

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

import { SqlAdapter } from 'js-data-sql'
import { Schema } from 'js-data'
import { DateTime } from 'luxon'
// import forEach from 'lodash.forEach'

class AutoSqlAdapter extends SqlAdapter {
  constructor (opts) {
    let knex = super(opts).knex
    this.knex = knex

    let auto = {
      timestamp: opts.auto.timestamp || true,
      alterTable: opts.auto.alterTable || true,
      arrayAs: opts.auto.arrayAs || {

      }
    }
    this.auto = auto
  }

  async createTable (mapper) {
    let table = mapper.table
    let primaryKey = mapper.idAttribute
    let relations = {
      hasOne: mapper.hasOne,
      hasMany: mapper.hasMany,
      belongsTo: mapper.belongsTo
    }
    let schema = mapper.schema
    let timestamp = mapper.timestamp || this.auto.timestamp

    if (relations) console.warn(relations, 'foreign key still need to be implemented manually')

    let tableColumns
    try {
      if (schema instanceof Schema) tableColumns = schema.properties
      else tableColumns = (new Schema(schema)).properties
      if (!tableColumns) throw Error('schema invalid')
      if (tableColumns[primaryKey]) delete tableColumns[primaryKey]
      for (const key in tableColumns) {
        tableColumns[key].exist = await this.knex.schema.hasColumn(table, key)
      }
      let timestampExist = {
        created_at: await this.knex.schema.hasColumn(table, 'created_at'),
        updated_at: await this.knex.schema.hasColumn(table, 'updated_at')
      }

      const callAlter = column => {
        // Add column
        for (const key in tableColumns) {
          /** array conversion (WIP)
           * hint: @see table.specificType in http://knexjs.org for defining column type thats not supported (e.g `array` as `jsonb[]`)
          */
          if (this.auto.arrayAs.type && tableColumns[key].type === 'array') {
            tableColumns[key].type = this.auto.arrayAs.type
          }
          if (!tableColumns[key].exist) column[tableColumns[key].type](key)
        }

        // Add timestamp
        if (timestamp) {
          if (!timestampExist.created_at) column.timestamp('created_at')
          if (!timestampExist.updated_at) column.timestamp('updated_at')
        }
      }

      // https://github.com/tgriesser/knex/issues/1628
      if (await this.knex.schema.hasTable(table)) { // check if the table is exist
        await this.knex.schema.table(table, column => { // alter table
          callAlter(column)
        })
      } else {
        await this.knex.schema.createTable(table, column => {
          column.increments(primaryKey || 'id').unsigned().unique().primary()
          callAlter(column)

          // Add relationship
          // console.log(super.makeBelongsToForeignKey(mapper))
          // forEach(relations, (typeVal, typeKey) => {
          //   forEach(typeVal, (relation, key) => {
          //     let foreignKey = relation['foreignKey']

          //     switch (typeKey) {
          //       case 'hasOne':
          //         column.integer(foreignKey).unique()
          //         break
          //       case 'hasMany':
          //         column.integer(foreignKey)
          //         break
          //     }
          //     if (typeKey === 'belongsTo') column.foreign(foreignKey).references().onDelete('CASCADE').onUpdate('CASCADE')
          //   })
          // })
        })
      }
    } catch (error) {
      throw error
    }
  }

  async beforeCreate (mapper, props, opts) {
    super.beforeCreate(mapper, props, opts)
    await this.createTable(mapper)
    if (mapper.timestamp || this.auto.timestamp) props.created_at = DateTime.local().toISO()

    /** array conversion (WIP)
     * Supported type:
     * @type string
    */
    let schema = mapper.schema.properties
    for (const key in props) {
      if (props[key] instanceof Array && schema[key].type === 'array') {
        switch (this.auto.arrayAs.type) {
          case 'string':
            props[key] = props[key].join(this.auto.arrayAs.delimiter)
            break
          default:
            break
        }
      }
    }
  }

  async beforeCreateMany (mapper, props, opts) {
    super.beforeCreateMany(mapper, props, opts)
    await this.createTable(mapper)
    if (mapper.timestamp || this.auto.timestamp) props.created_at = DateTime.local().toISO()
  }

  async beforeUpdate (mapper, props, opts) {
    super.beforeUpdate(mapper, props, opts)
    if (mapper.timestamp || this.auto.timestamp) props.updated_at = DateTime.local().toISO()
  }

  async beforeUpdateMany (mapper, props, opts) {
    super.beforeUpdateMany(mapper, props, opts)
    if (mapper.timestamp || this.auto.timestamp) props.updated_at = DateTime.local().toISO()
  }

  async beforeUpdateAll (mapper, props, query, opts) {
    super.beforeUpdateAll(mapper, props, query, opts)
    if (mapper.timestamp || this.auto.timestamp) props.updated_at = DateTime.local().toISO()
  }
}

export { AutoSqlAdapter as SqlAdapter }
