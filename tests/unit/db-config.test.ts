import { describe, expect, it } from "vitest";
import {
  DatabaseConfigError,
  embeddedTarget,
  lookalikeEnvNames,
  managedTarget,
  normaliseConnectionString,
  redactConnectionString,
  resolveDatabaseTarget,
} from "@/db/config";
import { explainDatabaseError, formatDatabaseFailure, rootCause } from "@/db/errors";

const NEON = "postgresql://neondb_owner:npg_secret@ep-cool-name-123456-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require";

describe("normaliseConnectionString", () => {
  it("trims whitespace and newlines from a pasted value", () => {
    expect(normaliseConnectionString(`  ${NEON} \r\n`)).toBe(NEON);
  });

  it("removes wrapping double or single quotes", () => {
    expect(normaliseConnectionString(`"${NEON}"`)).toBe(NEON);
    expect(normaliseConnectionString(`'${NEON}'`)).toBe(NEON);
    expect(normaliseConnectionString(`  '"${NEON}"'  `)).toBe(NEON);
  });

  it("removes the psql prefix that database consoles put in front of the copy snippet", () => {
    expect(normaliseConnectionString(`psql '${NEON}'`)).toBe(NEON);
  });
});

describe("redactConnectionString", () => {
  it("never leaves the password in a string we might print", () => {
    expect(redactConnectionString(NEON)).not.toContain("npg_secret");
    expect(redactConnectionString(NEON)).toContain("neondb_owner:***@");
  });
});

describe("managedTarget: TLS", () => {
  it("turns sslmode=require into an explicit, verified TLS setting and removes the parameter", () => {
    const target = managedTarget(NEON);
    expect(target.ssl).toEqual({ rejectUnauthorized: true });
    // The parameter must be gone, or pg-connection-string prints a SECURITY WARNING deprecation notice
    // and overrides the ssl setting we pass.
    expect(target.connectionString).not.toContain("sslmode");
    expect(target.host).toBe("ep-cool-name-123456-pooler.ap-southeast-2.aws.neon.tech");
    expect(target.port).toBe(5432);
    expect(target.database).toBe("neondb");
    expect(target.user).toBe("neondb_owner");
  });

  it("keeps non-TLS query parameters such as channel_binding", () => {
    const target = managedTarget(`${NEON}&channel_binding=require`);
    expect(target.connectionString).toContain("channel_binding=require");
    expect(target.connectionString).not.toContain("sslmode");
  });

  it("uses TLS for a hosted database whose connection string omits sslmode (Supabase, Railway, Render)", () => {
    const target = managedTarget("postgres://postgres.abcdef:pw@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres");
    expect(target.ssl).toEqual({ rejectUnauthorized: true });
    expect(target.port).toBe(6543);
  });

  it("does not use TLS for a database on this machine", () => {
    expect(managedTarget("postgresql://app:pw@localhost:5432/app").ssl).toBe(false);
    expect(managedTarget("postgresql://app:pw@127.0.0.1:5432/app").ssl).toBe(false);
  });

  it("honours sslmode=disable and sslmode=no-verify", () => {
    expect(managedTarget("postgresql://u:p@db.example.com/app?sslmode=disable").ssl).toBe(false);
    expect(managedTarget("postgresql://u:p@db.example.com/app?sslmode=no-verify").ssl).toEqual({ rejectUnauthorized: false });
  });

  it("lets DATABASE_SSL override the connection string", () => {
    expect(managedTarget(NEON, "no-verify").ssl).toEqual({ rejectUnauthorized: false });
    expect(managedTarget("postgresql://u:p@localhost/app", "require").ssl).toEqual({ rejectUnauthorized: true });
    expect(managedTarget(NEON, "  ").ssl).toEqual({ rejectUnauthorized: true });
  });

  it("rejects a DATABASE_SSL value it does not understand", () => {
    expect(() => managedTarget(NEON, "maybe")).toThrow(DatabaseConfigError);
  });

  it("leaves a connection string alone when it names certificate files", () => {
    const withCa = "postgresql://u:p@db.example.com/app?sslmode=verify-full&sslrootcert=/etc/ca.pem";
    const target = managedTarget(withCa);
    expect(target.ssl).toBeUndefined();
    expect(target.connectionString).toBe(withCa);
  });
});

describe("managedTarget: mistakes", () => {
  it("survives a value pasted with quotes and whitespace instead of resolving a host called base", () => {
    const target = managedTarget(`  "${NEON}"\n`);
    expect(target.host).toBe("ep-cool-name-123456-pooler.ap-southeast-2.aws.neon.tech");
  });

  it("explains a value that is not a PostgreSQL connection string", () => {
    expect(() => managedTarget("mysql://u:p@host/db")).toThrow(/must begin with postgresql/i);
    expect(() => managedTarget("ep-cool-name-123456.aws.neon.tech")).toThrow(DatabaseConfigError);
  });

  it("explains a connection string with no database name", () => {
    expect(() => managedTarget("postgresql://u:p@db.example.com")).toThrow(/names no database/i);
  });

  it("never puts the password in the description", () => {
    expect(managedTarget(NEON).description).not.toContain("npg_secret");
    expect(managedTarget(NEON).description).toContain("TLS, certificate checked");
  });
});

describe("resolveDatabaseTarget", () => {
  it("uses the embedded database when DATABASE_URL is unset or blank", () => {
    expect(resolveDatabaseTarget({ DATA_DIR: "./data/pglite" }).kind).toBe("embedded");
    expect(resolveDatabaseTarget({ DATABASE_URL: "   " }).kind).toBe("embedded");
  });

  it("uses the managed database when DATABASE_URL is set", () => {
    const target = resolveDatabaseTarget({ DATABASE_URL: NEON });
    expect(target.kind).toBe("managed");
    expect(target.description).toContain("managed PostgreSQL");
  });

  it("refuses to fall back to a local database on Vercel, which has no disk to keep one on", () => {
    expect(() => resolveDatabaseTarget({ VERCEL: "1" })).toThrow(/DATABASE_URL is not set on this Vercel deployment/);
  });

  it("names an in-memory database as such", () => {
    expect(embeddedTarget(":memory:").description).toContain("in memory only");
  });
});

describe("lookalikeEnvNames", () => {
  it("spots a connection string parked under the wrong variable name", () => {
    expect(lookalikeEnvNames({ POSTGRES_URL: NEON })).toEqual(["POSTGRES_URL"]);
    expect(lookalikeEnvNames({ DATABASEURL: NEON, DB_URL: NEON })).toEqual(["DATABASEURL", "DB_URL"]);
  });

  it("says nothing when DATABASE_URL itself is set", () => {
    expect(lookalikeEnvNames({ DATABASE_URL: NEON, POSTGRES_URL: NEON })).toEqual([]);
  });
});

describe("explainDatabaseError", () => {
  const target = managedTarget(NEON);

  it("digs the real error out of a drizzle wrapper", () => {
    const wrapped = Object.assign(new Error("Failed query: CREATE TABLE ..."), { cause: Object.assign(new Error("boom"), { code: "28P01" }) });
    expect((rootCause(wrapped) as { code: string }).code).toBe("28P01");
    expect(explainDatabaseError(wrapped, target).problem).toMatch(/refused the user name or password/);
  });

  it("suggests dropping channel_binding when authentication fails and the string carries it", () => {
    const withBinding = managedTarget(`${NEON}&channel_binding=require`);
    const err = Object.assign(new Error("password authentication failed"), { code: "28P01" });
    expect(explainDatabaseError(err, withBinding).action).toMatch(/channel_binding=require/);
    expect(explainDatabaseError(err, target).action).not.toMatch(/channel_binding/);
  });

  it("explains a host that does not resolve", () => {
    const failure = explainDatabaseError(Object.assign(new Error("getaddrinfo ENOTFOUND x"), { code: "ENOTFOUND" }), target);
    expect(failure.problem).toMatch(/could not be found/);
    expect(failure.action).toMatch(/typo/);
    expect(failure.detail).toContain("ENOTFOUND");
  });

  it("explains an unencrypted connection to a database that requires encryption", () => {
    const failure = explainDatabaseError(
      Object.assign(new Error("connection is insecure (try using `sslmode=require`)"), { code: "28000" }),
      target,
    );
    expect(failure.action).toMatch(/sslmode=require|DATABASE_SSL=require/);
  });

  it("explains a certificate that cannot be checked, and offers the escape hatch", () => {
    const failure = explainDatabaseError(Object.assign(new Error("self-signed certificate in certificate chain"), { code: "SELF_SIGNED_CERT_IN_CHAIN" }), target);
    expect(failure.action).toMatch(/DATABASE_SSL=no-verify/);
  });

  it("explains a missing database", () => {
    const failure = explainDatabaseError(Object.assign(new Error('database "neondb" does not exist'), { code: "3D000" }), target);
    expect(failure.problem).toMatch(/does not exist/);
  });

  it("passes a configuration mistake through unchanged", () => {
    const failure = explainDatabaseError(new DatabaseConfigError("DATABASE_URL must begin with postgresql://"), null);
    expect(failure.problem).toBe("DATABASE_URL must begin with postgresql://");
  });

  it("still says something useful about an error it does not recognise", () => {
    const failure = explainDatabaseError(new Error("something unexpected"), target);
    expect(failure.detail).toBe("something unexpected");
    expect(failure.action).toMatch(/DEBUG_DB=1/);
  });

  it("formats a failure block that names the target and keeps the technical detail", () => {
    const block = formatDatabaseFailure(Object.assign(new Error("getaddrinfo ENOTFOUND x"), { code: "ENOTFOUND" }), target);
    expect(block).toContain("Could not use the database.");
    expect(block).toContain("Target:");
    expect(block).toContain("Technical detail: getaddrinfo ENOTFOUND x");
    expect(block).not.toContain("npg_secret");
  });
});
