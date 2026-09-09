import * as init from "./0001_init";

export interface Migration {
  name: string;
  statements: string[];
}

/** Ordered list. Add new migrations at the end; never edit an applied one. */
export const MIGRATIONS: Migration[] = [{ name: init.name, statements: init.statements }];
