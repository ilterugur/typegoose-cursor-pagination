import { IPaginateResult, IPaginateOptions, SortOptions } from "./types";
import * as bsonUrlEncoding from "./utils/bsonUrlEncoding";
import R from 'ramda';

/**
 * Prepare a response to send back to the client
 * @param _docs The documents that are returned by the find() query
 * @param options The pagination optionsget
 */
export function prepareResponse<T>(
  _docs: T[],
  options: IPaginateOptions,
  totalDocs?: number
) {
   // Check if there is a next/previous page
  const hasMore = options.limit && _docs.length > options.limit;
  if (hasMore) {
      _docs.pop(); // Remove extra doc used to check for a next/previous page
  }

  // Reverse docs in case of previous page
  const docs = options.previous ? _docs.reverse() : _docs;

  // Next/previous page data
  const hasPrevious = options.next || (options.previous && hasMore) ? true : false;
  const hasNext = options.previous || hasMore ? true : false;
  const next = hasNext ? prepareCursor(docs[docs.length - 1], options.sortOptions) : undefined;
  const previous = hasPrevious ? prepareCursor(docs[0], options.sortOptions) : undefined;


  // Build result
  const result: IPaginateResult<T> = {
    docs,
    hasPrevious,
    hasNext,
    next,
    previous,
    ...(totalDocs !== undefined && { totalDocs }),
  };

  return result;
}

/**
 * Generate an encoded next/previous cursor string
 * @param doc The document from which to start the next/previous page
 * @param sortField The field on which was sorted
 */
function prepareCursor(doc: InstanceType<any>, sortOptions: SortOptions = {}): string {
  // Always save _id for secondary sorting.
  const keysExceptId = Object.keys(sortOptions).filter((key) => key !== "_id");
  const values = keysExceptId.map((key) => R.path(key.split('.'), doc));
  return bsonUrlEncoding.encode([
    ...values,
    doc._id,
  ]);
}
