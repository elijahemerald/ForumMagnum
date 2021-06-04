import * as _ from 'underscore';

export const mongoSelectorToSql = <T extends DbObject>(selector: MongoSelector<T>, options?: MongoFindOptions<T>, argOffset?: number) => {
  let queryTextFragments: string[] = [];
  let args: any[] = [];
  
  let selectorFragments: string[] = [];
  for (let selectorKey of Object.keys(selector)) {
    if (selector[selectorKey] === undefined) continue;
    const {sql,arg} = mongoSelectorFieldToSql(selectorKey, selector[selectorKey], (argOffset||1)+args.length);
    selectorFragments.push(sql);
    args = [...args, ...arg];
  }
  if (selectorFragments.length > 0)
    queryTextFragments.push(selectorFragments.join(' and '));
  
  if (options) {
    if (options.sort) {
      const {sql: sortFragment, arg: sortArgs} = mongoSortToOrderBy(options.sort, (argOffset||1)+args.length);
      queryTextFragments.push(sortFragment);
      args = [...args, ...sortArgs];
    }
    if (options.limit) {
      queryTextFragments.push('limit '+options.limit);
    }
  }
  
  return {
    sql: queryTextFragments.join(" "),
    arg: args,
  };
}

export const mongoSelectorFieldToSql = (fieldName: string, value: any, argOffset: number): {sql: string, arg: any[]} => {
  if (fieldName==="_id") {
    if (typeof value==="string") {
      return {
        sql: `id=$${argOffset}`,
        arg: [value],
      };
    } else if (typeof value==="object" && value.$in) {
      return {
        sql: `id IN (${_.range(value.$in.length).map(i => `$${i+argOffset}`)})`,
        arg: value.$in,
      };
    } else {
      throw new Error(`Don't know how to handle selector for ${fieldName}`); // TODO
    }
  } else if (fieldName==="$or") {
    const subselectors: any[] = [];
    for (let s of value) {
      const subselector = mongoSelectorToSql(s, undefined, argOffset);
      subselectors.push(subselector);
      argOffset += subselector.arg.length;
    }
    return {
      sql: `(${subselectors.map(s=>s.sql).join(" or ")})`,
      arg: _.flatten(subselectors.map(s=>s.arg, true)),
    };
  } else if (fieldName==="$and") {
    const subselectors: any[] = [];
    for (let s of value) {
      const subselector = mongoSelectorToSql(s, undefined, argOffset);
      subselectors.push(subselector);
      argOffset += subselector.arg.length;
    }
    return {
      sql: `(${subselectors.map(s=>s.sql).join(" and ")})`,
      arg: _.flatten(subselectors.map(s=>s.arg, true)),
    };
  } else if (fieldName==="$not") {
    throw new Error(`Don't know how to handle selector for ${fieldName}: $not`); // TODO
  } else if (value === null) {
    return {
      sql: `(jsonb_typeof(json->'fieldName') IS NULL OR jsonb_typeof(json->'fieldName')='null')`,
      arg: [],
    };
  } else if (typeof value==='object') {
    for (let op of Object.keys(value)) {
      if (op==="$in") {
        return {
          sql: `${mongoFieldToSql(fieldName, value.$in[0])} IN (${_.range(value.$in.length).map(i => `$${i+argOffset}`)})`,
          arg: value.$in,
        }
      } else if (op==="$gt") {
        return {
          sql: `${mongoFieldToSql(fieldName, value.$gt)} > $${argOffset}`,
          arg: [value.$gt],
        }
      } else if (op==="$gte") {
        return {
          sql: `${mongoFieldToSql(fieldName, value.$gte)} >= $${argOffset}`,
          arg: [value.$gte],
        }
      } else if (op==="$lt") {
        return {
          sql: `${mongoFieldToSql(fieldName, value.$lt)} < $${argOffset}`,
          arg: [value.$lt],
        }
      } else if (op==="$lte") {
        return {
          sql: `${mongoFieldToSql(fieldName, value.$lte)} <= $${argOffset}`,
          arg: [value.$lte],
        }
      } else if (op==="$exists") {
        if (value.$exists) {
          return {
            sql: `json ? '${fieldName}'`,
            arg: [],
          }
        } else {
          return {
            sql: `not (json ? '${fieldName}')`,
            arg: [],
          }
        }
      } else if (op==="$ne") {
        if (value.$ne === null) {
          return {
            sql: `json ? '${fieldName}' and json->>'${fieldName}'!='null'`,
            arg: [],
          }
        } else {
          return {
            sql: `${mongoFieldToSql(fieldName, value.$ne)} != $${argOffset}`,
            arg: [value.$ne],
          }
        }
      } else {
        throw new Error(`Don't know how to handle selector for ${fieldName} op ${op}`); // TODO
      }
    }
    throw new Error(`Don't know how to handle selector for ${fieldName}: unrecognized object`); // TODO
  } else {
    return {
      sql: `${mongoFieldToSql(fieldName, value)}=$${argOffset}`,
      arg: [value],
    };
  }
}

const mongoFieldToSql = (fieldName: string, inferTypeFromValue: any) => {
  if (typeof inferTypeFromValue === 'string') {
    return `(json->>'${fieldName}')`;
  } else if (typeof inferTypeFromValue === 'number') {
    return `(json->'${fieldName}')::int`;
  } else if (typeof inferTypeFromValue==='boolean') {
    return `(json->'${fieldName}')::boolean`;
  } else if (inferTypeFromValue instanceof Date) {
    return `(json->>'${fieldName}')`;
  } else {
    // TODO
    throw new Error(`Don't know how to handle selector for ${fieldName}: cannot infer type from ${inferTypeFromValue}`);
  }
}

const mongoSortToOrderBy = (mongoSort: any, argOffset: number): {sql: string, arg: string[]} => {
  const fragments: string[] = [];
  for (let sortKey of Object.keys(mongoSort)) {
    if (sortKey==='_id') {
      fragments.push(`id ${mongoSortDirectionToSql(mongoSort[sortKey])}`);
    } else {
      fragments.push(`json->>'${sortKey}' ${mongoSortDirectionToSql(mongoSort[sortKey])}`);
    }
  }
  
  return {
    sql: `order by ${fragments.join(", ")}`,
    arg: [],
  }
}

const mongoSortDirectionToSql = (sortDirection: number): string => {
  if (sortDirection===1) {
    return "ASC";
  } else if (sortDirection===-1) {
    return "DESC";
  } else {
    throw new Error(`Invalid sort direction: ${sortDirection}`);
  }
}
